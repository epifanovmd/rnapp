import type { IMainApi } from "@shared/api";
import type { AuditEventDto } from "@shared/api/gen/main/model";

import { AuditStore } from "../store";

const event = (id: string): AuditEventDto => ({
  id,
  type: "auth.login.succeeded",
  actorId: "u1",
  subjectId: "u1",
  ip: null,
  userAgent: null,
  meta: {},
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("AuditStore", () => {
  it("подгружает страницы по курсору из предыдущего ответа", async () => {
    const getMyAudit = jest
      .fn()
      .mockResolvedValueOnce({
        data: { items: [event("e1"), event("e2")], nextCursor: "c1" },
      })
      .mockResolvedValueOnce({
        data: { items: [event("e3")], nextCursor: null },
      });
    const store = new AuditStore({ getMyAudit } as unknown as IMainApi);

    await store.load();
    expect(store.eventsHolder.hasMore).toBe(true);

    await store.loadMore();

    expect(getMyAudit).toHaveBeenNthCalledWith(2, { cursor: "c1", limit: 20 });
    expect(store.events.map(e => e.id)).toEqual(["e1", "e2", "e3"]);
    expect(store.eventsHolder.hasMore).toBe(false);
  });

  it("без курсора следующую страницу не запрашивает", async () => {
    const getMyAudit = jest.fn().mockResolvedValue({
      data: { items: [event("e1")], nextCursor: null },
    });
    const store = new AuditStore({ getMyAudit } as unknown as IMainApi);

    await store.load();
    await store.loadMore();

    expect(getMyAudit).toHaveBeenCalledTimes(1);
  });
});
