import { ApiResponse, HttpError, toCancelable } from "@shared/lib/http";

import type {
  DummyJsonAuthUser,
  DummyJsonCredentials,
  DummyJsonTokens,
  IDummyJsonAuthApi,
} from "../dummyjson.types";
import { DummyJsonSession } from "../dummyjson-session";

const authUser = (suffix: string): DummyJsonAuthUser =>
  ({
    id: 1,
    username: "emilys",
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
  }) as DummyJsonAuthUser;

const result = <T>(value: ApiResponse<T>) =>
  toCancelable(Promise.resolve(value), () => {});

const createAuthApi = (): jest.Mocked<IDummyJsonAuthApi> => ({
  login: jest.fn((_credentials: DummyJsonCredentials) =>
    result({ data: authUser("1") }),
  ),
  refresh: jest.fn((_refreshToken: string, _expiresInMins?: number) =>
    result<DummyJsonTokens>({
      data: { accessToken: "access-2", refreshToken: "refresh-2" },
    }),
  ),
});

const credentials = { username: "emilys", password: "emilyspass" };

describe("DummyJsonSession", () => {
  it("до логина сессии нет", () => {
    const session = new DummyJsonSession(createAuthApi());

    expect(session.accessToken).toBe("");
    expect(session.isAuthorized).toBe(false);
  });

  it("login сохраняет токены и возвращает пользователя", async () => {
    const api = createAuthApi();
    const session = new DummyJsonSession(api);
    const res = await session.login(credentials);

    expect(res.data?.username).toBe("emilys");
    expect(session.tokens).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
    expect(session.isAuthorized).toBe(true);
    expect(api.login).toHaveBeenCalledWith(credentials);
  });

  it("login возвращает CancelablePromise и при ошибке не трогает токены", async () => {
    const api = createAuthApi();

    api.login.mockReturnValue(
      result({
        error: new HttpError({ status: 400, body: { message: "bad" } }),
      }),
    );
    const session = new DummyJsonSession(api);
    const pending = session.login(credentials);

    expect(typeof pending.cancel).toBe("function");
    expect((await pending).error?.status).toBe(400);
    expect(session.isAuthorized).toBe(false);
  });

  it("refreshToken обновляет пару через свой эндпоинт", async () => {
    const api = createAuthApi();
    const session = new DummyJsonSession(api);

    await session.login(credentials);
    await session.refreshToken();

    expect(api.refresh).toHaveBeenCalledWith("refresh-1");
    expect(session.accessToken).toBe("access-2");
  });

  it("ошибка refresh очищает сессию", async () => {
    const api = createAuthApi();
    const error = new HttpError({ status: 403, body: { message: "expired" } });

    api.refresh.mockReturnValue(result({ error }));
    const session = new DummyJsonSession(api);

    await session.login(credentials);
    await expect(session.refreshToken()).rejects.toBe(error);
    expect(session.isAuthorized).toBe(false);
  });

  it("стратегия реактивная: ensureFreshToken не обновляет заранее", async () => {
    const api = createAuthApi();
    const session = new DummyJsonSession(api);

    await session.login(credentials);
    await session.ensureFreshToken();

    expect(api.refresh).not.toHaveBeenCalled();
    expect(session.accessToken).toBe("access-1");
  });

  it("хранение только в памяти: новая сессия пустая", async () => {
    const api = createAuthApi();

    await new DummyJsonSession(api).login(credentials);

    expect(new DummyJsonSession(api).isAuthorized).toBe(false);
  });

  it("clear разлогинивает", async () => {
    const session = new DummyJsonSession(createAuthApi());

    await session.login(credentials);
    session.clear();

    expect(session.accessToken).toBe("");
    expect(session.isAuthorized).toBe(false);
  });
});
