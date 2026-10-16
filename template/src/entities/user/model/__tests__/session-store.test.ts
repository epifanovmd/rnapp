import type { IMainApi } from "@shared/api";
import type { SessionDto } from "@shared/api/gen/main/model";
import type { IAuthSessionGuard } from "@shared/lib/contracts";

import { SessionStore } from "../session-store";

const session = (id: string): SessionDto => ({
  id,
  userId: "u1",
  deviceName: null,
  deviceType: null,
  ip: null,
  userAgent: null,
  lastActiveAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-02-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
});

const createStore = (api: Partial<IMainApi>) =>
  new SessionStore(
    api as IMainApi,
    {
      isCurrentSession: () => false,
      signOut: jest.fn(),
    } as IAuthSessionGuard,
  );

describe("SessionStore", () => {
  it("кладёт в список элементы страницы, а не саму страницу", async () => {
    const page = {
      items: [session("s1"), session("s2")],
      total: 2,
      offset: 0,
      limit: 100,
    };
    const store = createStore({
      getSessions: jest.fn(async () => ({ data: page })) as never,
    });

    await store.load();

    expect(store.sessions.map(s => s.id)).toEqual(["s1", "s2"]);
  });

  it("завершены все сессии (аккаунт удалён) — выход", () => {
    const guard = { isCurrentSession: () => false, signOut: jest.fn() };
    const store = new SessionStore({} as IMainApi, guard as IAuthSessionGuard);

    store.handleSessionTerminated("all");

    expect(guard.signOut).toHaveBeenCalledTimes(1);
  });

  it("завершена чужая сессия — без выхода", () => {
    const guard = { isCurrentSession: () => false, signOut: jest.fn() };
    const store = new SessionStore({} as IMainApi, guard as IAuthSessionGuard);

    store.handleSessionTerminated("s9");

    expect(guard.signOut).not.toHaveBeenCalled();
  });

  it("reset очищает список: следующий пользователь не видит чужих сессий", async () => {
    const store = createStore({
      getSessions: jest.fn(async () => ({
        data: { items: [session("s1")], total: 1, offset: 0, limit: 100 },
      })) as never,
    });

    await store.load();
    store.reset();

    expect(store.sessions).toEqual([]);
    expect(store.sessionsHolder.isIdle).toBe(true);
  });
});

describe("SessionStore.terminateOtherSessions", () => {
  it("отдаёт ошибку API потребителю", async () => {
    const error = { message: "Нет прав", status: 403 };
    const store = createStore({
      terminateOtherSessions: jest.fn(async () => ({ error })) as never,
      getSessions: jest.fn(async () => ({
        data: { items: [], total: 0, offset: 0, limit: 100 },
      })) as never,
    });

    const res = await store.terminateOtherSessions();

    expect(res.error).toBe(error);
  });

  it("при успехе перечитывает сессии", async () => {
    const getSessions = jest.fn(async () => ({
      data: { items: [session("s1")], total: 1, offset: 0, limit: 100 },
    }));
    const store = createStore({
      terminateOtherSessions: jest.fn(async () => ({
        data: undefined,
      })) as never,
      getSessions: getSessions as never,
    });

    const res = await store.terminateOtherSessions();

    expect(res.error).toBeUndefined();
    expect(getSessions).toHaveBeenCalledTimes(1);
    expect(store.sessions.map(s => s.id)).toEqual(["s1"]);
  });
});
