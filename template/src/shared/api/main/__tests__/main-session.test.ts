import { HttpError, NetworkError, TimeoutError } from "@shared/lib/http";
import type { IStorageService } from "@shared/lib/storage";

import type { IMainAuthApi } from "../main-auth.api";
import { createMainSession } from "../main-session";

const createStorage = (): IStorageService => {
  const data = new Map<string, string>();

  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: key => {
      data.delete(key);
    },
    getAllKeys: () => [...data.keys()],
  };
};

const createSession = (error: Error) => {
  const api = {
    refresh: jest.fn(async () => ({ error })),
  } as unknown as IMainAuthApi;
  const session = createMainSession(api, createStorage());
  const onExpired = jest.fn();

  session.onSessionExpired(onExpired);
  session.setTokens({ accessToken: "a", refreshToken: "r" });

  return { session, onExpired };
};

describe("createMainSession: что считать концом сессии", () => {
  it.each([
    ["нет сети", new NetworkError()],
    ["таймаут", new TimeoutError()],
    ["5xx", new HttpError({ status: 502 })],
    ["429", new HttpError({ status: 429 })],
  ])("%s — временная ошибка, сессия остаётся", async (_, error) => {
    const { session, onExpired } = createSession(error);

    await expect(session.refreshToken()).rejects.toBe(error);
    expect(session.accessToken).toBe("a");
    expect(onExpired).not.toHaveBeenCalled();
  });

  it.each([401, 403, 400])("%i — сессии нет", async status => {
    const { session, onExpired } = createSession(new HttpError({ status }));

    await expect(session.refreshToken()).rejects.toBeInstanceOf(HttpError);
    expect(session.isAuthorized).toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
