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

  it("новое событие — в начало загруженной ленты, без дублей", async () => {
    const getMyAudit = jest.fn().mockResolvedValue({
      data: { items: [event("e1")], nextCursor: null },
    });
    const store = new AuditStore({ getMyAudit } as unknown as IMainApi);

    store.prepend(event("e0"));
    expect(store.events).toEqual([]);

    await store.load();
    store.prepend(event("e2"));
    store.prepend(event("e2"));

    expect(store.events.map(e => e.id)).toEqual(["e2", "e1"]);
  });
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });

  return { promise, resolve };
};

const page = (ids: string[], nextCursor: string | null) => ({
  data: { items: ids.map(event), nextCursor },
});

describe("AuditStore — устаревшие ответы", () => {
  it("ответ, пришедший после reset (выход), не попадает в ленту", async () => {
    const pending = deferred<unknown>();
    const store = new AuditStore({
      getMyAudit: jest.fn().mockReturnValueOnce(pending.promise),
    } as unknown as IMainApi);

    const loading = store.load();

    store.reset();
    pending.resolve(page(["чужое"], "c-1"));
    await loading;

    expect(store.events).toEqual([]);
    expect(store.eventsHolder.isIdle).toBe(true);
    expect(store.eventsHolder.hasMore).toBe(false);
  });

  it("во время новой загрузки loadMore со старым курсором не уходит", async () => {
    const reload = deferred<unknown>();
    const getMyAudit = jest
      .fn()
      .mockResolvedValueOnce(page(["e1"], "c-old"))
      .mockReturnValueOnce(reload.promise);
    const store = new AuditStore({ getMyAudit } as unknown as IMainApi);

    await store.load();
    const loading = store.load();

    await store.loadMore();

    expect(getMyAudit).toHaveBeenCalledTimes(2);

    reload.resolve(page(["e2"], null));
    await loading;

    expect(store.events.map(e => e.id)).toEqual(["e2"]);
  });

  it("подгрузка, начатая до новой загрузки, отбрасывается", async () => {
    const more = deferred<unknown>();
    const getMyAudit = jest
      .fn()
      .mockResolvedValueOnce(page(["e1"], "c-1"))
      .mockReturnValueOnce(more.promise)
      .mockResolvedValueOnce(page(["x"], null));
    const store = new AuditStore({ getMyAudit } as unknown as IMainApi);

    await store.load();
    const older = store.loadMore();

    await store.load();
    more.resolve(page(["old"], "c-2"));
    await older;

    expect(store.events.map(e => e.id)).toEqual(["x"]);
    expect(store.eventsHolder.hasMore).toBe(false);
    expect(store.eventsHolder.isLoadingMore).toBe(false);
  });
});
