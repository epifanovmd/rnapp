import type { IMainApi } from "@shared/api";
import { HttpError } from "@shared/lib/http";
import type { ITokenSession } from "@shared/lib/session";

import { AuthStore } from "../store";

const createStore = (api: Partial<IMainApi>) =>
  new AuthStore(
    api as IMainApi,
    {
      onSessionExpired: jest.fn(),
      setTokens: jest.fn(),
      clear: jest.fn(),
    } as unknown as ITokenSession,
  );

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
