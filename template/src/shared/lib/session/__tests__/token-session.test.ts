import type { ITokenSource } from "@shared/lib/http";

import { refreshAlways, refreshBeforeJwtExpiry } from "../refresh-policy";
import type { ITokenSession, TokenPair } from "../session.types";
import { MemoryTokenStorage } from "../storage/memory-token-storage";
import { TokenSession } from "../token-session";
import { makeJwt, nowSeconds } from "./token-test-utils";

const pair = (suffix: string): TokenPair => ({
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
});

const createSession = (
  overrides: Partial<ConstructorParameters<typeof TokenSession>[0]> = {},
) => {
  const refresh = jest.fn(async (_token: string) => pair("2"));

  return {
    refresh,
    session: new TokenSession({ refresh, ...overrides }),
  };
};

describe("TokenSession", () => {
  it("без токенов сессии нет", () => {
    const { session } = createSession();

    expect(session.accessToken).toBe("");
    expect(session.isAuthorized).toBe(false);
    expect(session.tokens).toEqual({ accessToken: "", refreshToken: "" });
  });

  it("setTokens кладёт пару в память и в хранилище, отбрасывая лишние поля", () => {
    const storage = new MemoryTokenStorage();
    const { session } = createSession({ storage });

    session.setTokens({ ...pair("1"), user: { id: 1 } } as TokenPair);

    expect(session.tokens).toEqual(pair("1"));
    expect(storage.read()).toEqual(pair("1"));
    expect(session.isAuthorized).toBe(true);
  });

  it("конструктор поднимает токены из хранилища", () => {
    const storage = new MemoryTokenStorage();

    storage.write(pair("1"));

    expect(createSession({ storage }).session.tokens).toEqual(pair("1"));
  });

  it("clear чистит и память, и хранилище", () => {
    const storage = new MemoryTokenStorage();
    const { session } = createSession({ storage });

    session.setTokens(pair("1"));
    session.clear();

    expect(session.isAuthorized).toBe(false);
    expect(storage.read()).toBeNull();
  });

  it("refreshToken меняет пару через обработчик бэкенда", async () => {
    const { session, refresh } = createSession();

    session.setTokens(pair("1"));
    await session.refreshToken();

    expect(refresh).toHaveBeenCalledWith("refresh-1");
    expect(session.tokens).toEqual(pair("2"));
  });

  it("параллельные вызовы делят один refresh", async () => {
    const { session, refresh } = createSession();

    session.setTokens(pair("1"));
    await Promise.all([
      session.refreshToken(),
      session.refreshToken(),
      session.ensureFreshToken(),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("следующий refresh после завершения предыдущего — новый вызов", async () => {
    const { session, refresh } = createSession();

    session.setTokens(pair("1"));
    await session.refreshToken();
    await session.refreshToken();

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("ошибка refresh очищает сессию и поднимает onSessionExpired", async () => {
    const error = new Error("expired");
    const { session, refresh } = createSession();
    const onExpired = jest.fn();

    refresh.mockRejectedValue(error);
    session.onSessionExpired(onExpired);
    session.setTokens(pair("1"));

    await expect(session.refreshToken()).rejects.toBe(error);
    expect(session.isAuthorized).toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("refresh без токена бросает, но сессию протухшей не объявляет", async () => {
    const { session, refresh } = createSession();
    const onExpired = jest.fn();

    session.onSessionExpired(onExpired);

    await expect(session.refreshToken()).rejects.toThrow(
      "No refresh token available",
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(onExpired).not.toHaveBeenCalled();
  });

  it("ensureFreshToken: по умолчанию заранее не обновляет", async () => {
    const { session, refresh } = createSession();

    session.setTokens(pair("1"));
    await session.ensureFreshToken();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("ensureFreshToken слушается политики, но не трогает пустую сессию", async () => {
    const { session, refresh } = createSession({
      shouldRefresh: refreshAlways,
    });

    await session.ensureFreshToken();
    expect(refresh).not.toHaveBeenCalled();

    session.setTokens(pair("1"));
    await session.ensureFreshToken();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("политика по exp JWT обновляет только просроченный токен", async () => {
    const jwt = (expSeconds: number) =>
      makeJwt({ sub: "1", iat: 0, exp: expSeconds });
    const now = nowSeconds();
    const { session, refresh } = createSession({
      shouldRefresh: refreshBeforeJwtExpiry(60),
    });

    session.setTokens({ accessToken: jwt(now + 600), refreshToken: "r" });
    await session.ensureFreshToken();
    expect(refresh).not.toHaveBeenCalled();

    session.setTokens({ accessToken: jwt(now + 10), refreshToken: "r" });
    await session.ensureFreshToken();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("restoreSession поднимает сессию по сохранённому refresh-токену", async () => {
    const storage = new MemoryTokenStorage();

    storage.write({ accessToken: "", refreshToken: "refresh-1" });
    const { session, refresh } = createSession({ storage });

    await expect(session.restoreSession()).resolves.toBe(true);
    expect(refresh).toHaveBeenCalledWith("refresh-1");
    expect(session.accessToken).toBe("access-2");
  });

  it("restoreSession без сохранённого токена не ходит в сеть", async () => {
    const { session, refresh } = createSession();

    await expect(session.restoreSession()).resolves.toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("restoreSession при неудачном refresh возвращает false, а не бросает", async () => {
    const storage = new MemoryTokenStorage();

    storage.write({ accessToken: "", refreshToken: "refresh-1" });
    const { session, refresh } = createSession({ storage });

    refresh.mockRejectedValue(new Error("gone"));

    await expect(session.restoreSession()).resolves.toBe(false);
    expect(session.isAuthorized).toBe(false);
  });

  it("onTokenChange срабатывает сразу и на каждую смену access-токена", () => {
    const { session } = createSession();
    const seen: string[] = [];

    session.setTokens(pair("1"));
    const unsubscribe = session.onTokenChange(token => seen.push(token));

    session.setTokens(pair("2"));
    session.clear();
    unsubscribe();
    session.setTokens(pair("1"));

    expect(seen).toEqual(["access-1", "access-2", ""]);
  });

  it("onTokenChange молчит, если access-токен не изменился", () => {
    const { session } = createSession();
    const listener = jest.fn();

    session.onTokenChange(listener);
    session.setTokens({ accessToken: "", refreshToken: "refresh-1" });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("отписка от onSessionExpired работает", async () => {
    const { session, refresh } = createSession();
    const listener = jest.fn();

    refresh.mockRejectedValue(new Error("x"));
    session.onSessionExpired(listener)();
    session.setTokens(pair("1"));

    await expect(session.refreshToken()).rejects.toThrow("x");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("TokenSession: правки хранилища извне", () => {
  /** Хранилище с ручным внешним писателем — имитирует другую вкладку. */
  const createShared = () => {
    const inner = new MemoryTokenStorage();
    const listeners = new Set<(tokens: TokenPair | null) => void>();

    return {
      storage: {
        read: () => inner.read(),
        write: (tokens: TokenPair) => inner.write(tokens),
        clear: () => inner.clear(),
        subscribe: (listener: (tokens: TokenPair | null) => void) => {
          listeners.add(listener);

          return () => listeners.delete(listener);
        },
      },
      writeOutside: (tokens: TokenPair | null) => {
        if (tokens) {
          inner.write(tokens);
        } else {
          inner.clear();
        }
        listeners.forEach(listener => listener(tokens));
      },
      listenerCount: () => listeners.size,
    };
  };

  it("подхватывает токены, записанные снаружи", () => {
    const shared = createShared();
    const { session } = createSession({ storage: shared.storage });
    const seen: string[] = [];

    session.onTokenChange(token => seen.push(token));
    shared.writeOutside(pair("1"));

    expect(session.tokens).toEqual(pair("1"));
    expect(seen).toEqual(["", "access-1"]);
  });

  it("исчезновение токенов снаружи завершает сессию", () => {
    const shared = createShared();
    const { session } = createSession({ storage: shared.storage });
    const onExpired = jest.fn();

    session.onSessionExpired(onExpired);
    session.setTokens(pair("1"));
    shared.writeOutside(null);

    expect(session.isAuthorized).toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("пустое хранилище без прежней сессии не поднимает onSessionExpired", () => {
    const shared = createShared();
    const { session } = createSession({ storage: shared.storage });
    const onExpired = jest.fn();

    session.onSessionExpired(onExpired);
    shared.writeOutside(null);

    expect(onExpired).not.toHaveBeenCalled();
  });

  it("подхваченные токены не переписываются обратно в хранилище", () => {
    const shared = createShared();
    const write = jest.spyOn(shared.storage, "write");
    const { session } = createSession({ storage: shared.storage });

    shared.writeOutside(pair("2"));

    expect(write).not.toHaveBeenCalled();
    expect(session.accessToken).toBe("access-2");
  });

  it("dispose отписывается от хранилища", () => {
    const shared = createShared();
    const { session } = createSession({ storage: shared.storage });

    expect(shared.listenerCount()).toBe(1);
    session.dispose();
    expect(shared.listenerCount()).toBe(0);

    shared.writeOutside(pair("1"));
    expect(session.isAuthorized).toBe(false);
  });

  it("хранилище без subscribe работает как раньше", () => {
    const { session } = createSession({ storage: new MemoryTokenStorage() });

    expect(() => session.dispose()).not.toThrow();
  });
});

describe("совместимость контрактов", () => {
  it("сессия годится как ITokenSource для bearerAuth", () => {
    const { session } = createSession();
    // Проверка на уровне типов: lib/session не импортирует контракт lib/http,
    // совпадение обеспечивается структурно.
    const source: ITokenSource = session;
    const asSession: ITokenSession = session;

    expect(source.accessToken).toBe(asSession.accessToken);
  });
});
