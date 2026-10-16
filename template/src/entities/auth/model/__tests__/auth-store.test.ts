import type { IMainApi } from "@shared/api";
import { HttpError } from "@shared/lib/http";
import type { ITokenSession } from "@shared/lib/session";

import { AuthStore } from "../store";
import { AuthStatus } from "../types";

const createStore = (api: Partial<IMainApi>) =>
  new AuthStore(
    api as IMainApi,
    {
      onSessionExpired: jest.fn(),
      onTokenChange: jest.fn(() => () => undefined),
      setTokens: jest.fn(),
      clear: jest.fn(),
    } as unknown as ITokenSession,
  );

const TOKENS = {
  accessToken: "a",
  refreshToken: "r",
  expiresIn: 900,
  sessionId: "s1",
};

/** Сессия с живыми подписками: `emit` — смена access-токена извне стора. */
const createSession = () => {
  let accessToken = "";
  const tokenListeners = new Set<(token: string) => void>();
  const emit = (token: string) => {
    accessToken = token;
    tokenListeners.forEach(listener => listener(token));
  };

  return {
    emit,
    setTokens: jest.fn((tokens: { accessToken: string }) =>
      emit(tokens.accessToken),
    ),
    clear: jest.fn(() => emit("")),
    restoreSession: jest.fn(async () => false),
    onSessionExpired: jest.fn(() => () => undefined),
    onTokenChange: (listener: (token: string) => void) => {
      tokenListeners.add(listener);
      listener(accessToken);

      return () => tokenListeners.delete(listener);
    },
  };
};

const setup = (api: Partial<IMainApi> = {}) => {
  const session = createSession();
  const store = new AuthStore(
    api as IMainApi,
    session as unknown as ITokenSession,
  );

  return { store, session };
};

describe("AuthStore.signUp", () => {
  it("возвращает ошибку сервера, чтобы экран её показал", async () => {
    const error = new HttpError({ status: 409, message: "Email уже занят" });
    const store = createStore({
      signUp: jest.fn().mockResolvedValue({ data: null, error }),
    } as Partial<IMainApi>);

    const res = await store.signUp({ email: "a@b.c", password: "secret1" });

    expect(res).toBe(error);
    expect(store.isAuthenticated).toBe(false);
  });
});

describe("AuthStore.signIn", () => {
  it("неверный пароль — возвращает ошибку для тоста", async () => {
    const error = new HttpError({
      status: 401,
      message: "Неверный логин или пароль",
    });
    const store = createStore({
      signIn: jest.fn().mockResolvedValue({ data: null, error }),
    } as Partial<IMainApi>);

    const res = await store.signIn({ login: "a@b.c", password: "wrong" });

    expect(res).toBe(error);
    expect(store.isAuthenticated).toBe(false);
  });

  it("ошибка второго пароля 2FA — возвращается из verify2FA", async () => {
    const error = new HttpError({
      status: 401,
      message: "Неверный второй пароль",
    });
    const store = createStore({
      signIn: jest.fn().mockResolvedValue({
        data: { require2FA: true, twoFactorToken: "t1" },
        error: null,
      }),
      verify2FA: jest.fn().mockResolvedValue({ data: null, error }),
    } as Partial<IMainApi>);

    await store.signIn({ login: "a@b.c", password: "secret1" });

    expect(await store.verify2FA("wrong")).toBe(error);
  });
});

describe("AuthStore.logout", () => {
  it("завершает сессию на сервере без тоста, затем выходит локально", async () => {
    const calls: string[] = [];
    const signOut = jest.fn(async () => {
      calls.push("server");

      return { data: undefined };
    });
    const { store, session } = setup({
      signOut,
    } as unknown as Partial<IMainApi>);

    session.clear.mockImplementation(() => {
      calls.push("local");
      session.emit("");
    });
    await store.restore(TOKENS);

    await store.logout();

    expect(signOut).toHaveBeenCalledWith({ notifyErrors: false });
    expect(calls).toEqual(["server", "local"]);
    expect(store.status).toBe(AuthStatus.Unauthenticated);
  });

  it("ошибка сервера не мешает локальному выходу", async () => {
    const signOut = jest.fn(async () => ({
      error: new HttpError({ status: 503, message: "нет сети" }),
    }));
    const { store, session } = setup({
      signOut,
    } as unknown as Partial<IMainApi>);

    await store.restore(TOKENS);
    await store.logout();

    expect(session.clear).toHaveBeenCalledTimes(1);
    expect(store.status).toBe(AuthStatus.Unauthenticated);
  });
});

describe("AuthStore — токен пришёл вне вызовов стора", () => {
  it("временная ошибка restore, затем успешный повтор refresh — вход", async () => {
    const { store, session } = setup();

    await store.restore();
    expect(store.status).toBe(AuthStatus.Unauthenticated);

    session.emit("fresh");

    expect(store.status).toBe(AuthStatus.Authenticated);
  });

  it("первичный вызов подписки с пустым токеном не меняет статус", () => {
    const { store } = setup();

    expect(store.status).toBe(AuthStatus.Idle);
  });

  it("ждём второй фактор — токен не переводит во вход", async () => {
    const { store, session } = setup({
      signIn: jest.fn().mockResolvedValue({
        data: { require2FA: true, twoFactorToken: "t" },
      }),
    } as Partial<IMainApi>);

    await store.signIn({ login: "a@b.c", password: "secret1" });
    session.emit("other");

    expect(store.status).toBe(AuthStatus.Unauthenticated);
  });

  it("во время входа токен не меняет статус — его выставит сам вызов", async () => {
    let resolve!: (value: unknown) => void;
    const { store, session } = setup({
      signIn: jest.fn(
        () =>
          new Promise(r => {
            resolve = r;
          }),
      ),
    } as unknown as Partial<IMainApi>);

    const pending = store.signIn({ login: "a@b.c", password: "wrong" });

    session.emit("x");
    expect(store.status).toBe(AuthStatus.Loading);

    resolve({ error: new HttpError({ status: 401, message: "Неверно" }) });
    await pending;

    expect(store.status).toBe(AuthStatus.Unauthenticated);
  });
});
