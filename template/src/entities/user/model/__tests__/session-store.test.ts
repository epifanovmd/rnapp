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
});
