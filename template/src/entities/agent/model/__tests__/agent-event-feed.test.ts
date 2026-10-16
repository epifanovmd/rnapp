import type { IAgentEventDto } from "@shared/api/gen/main/model";

import { AGENT_EVENTS_PAGE_SIZE, AgentEventFeed } from "../agent-event-feed";

const event = (id: string, patch: Partial<IAgentEventDto> = {}) => ({
  id,
  agentId: "a-1",
  worker: "echo",
  type: "state.result",
  at: 1,
  receivedAt: 2,
  ...patch,
});

describe("AgentEventFeed", () => {
  it("первая страница, подгрузка по курсору и новые — в начало без повторов", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce({
        data: { items: [event("2"), event("1")], nextCursor: "c1" },
      })
      .mockResolvedValueOnce({
        data: { items: [event("0")], nextCursor: null },
      });
    const feed = new AgentEventFeed(fetch);

    await feed.load();
    expect(fetch).toHaveBeenLastCalledWith(undefined, 50);
    expect(feed.hasMore).toBe(true);

    await feed.loadMore();
    expect(fetch).toHaveBeenLastCalledWith("c1", 50);
    expect(feed.items.map(item => item.id)).toEqual(["2", "1", "0"]);
    expect(feed.hasMore).toBe(false);

    // Курсора больше нет — новых запросов нет.
    await feed.loadMore();
    expect(fetch).toHaveBeenCalledTimes(2);

    feed.prepend(event("3"));
    feed.prepend(event("3"));
    // Тот же id у другого агента — другое событие.
    feed.prepend(event("3", { agentId: "a-2" }));
    expect(feed.items.map(item => item.id)).toEqual(["3", "3", "2", "1", "0"]);
  });

  it("ошибка — в error, список пуст", async () => {
    const feed = new AgentEventFeed(
      jest.fn().mockResolvedValue({ error: { message: "нет доступа" } }),
    );

    await feed.load();
    expect(feed.items).toEqual([]);
    expect(feed.error?.message).toBe("нет доступа");
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
  data: { items: ids.map(id => event(id)), nextCursor },
});

describe("AgentEventFeed — устаревшие ответы", () => {
  it("смена фильтра A→B: ответ A, пришедший последним, не применяется", async () => {
    const a = deferred<unknown>();
    const b = deferred<unknown>();
    const fetch = jest
      .fn()
      .mockReturnValueOnce(a.promise)
      .mockReturnValueOnce(b.promise);
    const feed = new AgentEventFeed(fetch);

    const first = feed.load();
    const second = feed.load();

    b.resolve(page(["b"], null));
    await second;
    a.resolve(page(["a"], "c-a"));
    await first;

    expect(feed.items.map(e => e.id)).toEqual(["b"]);
    expect(feed.hasMore).toBe(false);
  });

  it("во время новой загрузки loadMore со старым курсором не уходит", async () => {
    const reload = deferred<unknown>();
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(page(["e-1"], "c-old"))
      .mockReturnValueOnce(reload.promise);
    const feed = new AgentEventFeed(fetch);

    await feed.load();
    const pending = feed.load();

    await feed.loadMore();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).not.toHaveBeenCalledWith("c-old", AGENT_EVENTS_PAGE_SIZE);

    reload.resolve(page(["e-2"], null));
    await pending;

    expect(feed.isLoading).toBe(false);
    expect(feed.items.map(e => e.id)).toEqual(["e-2"]);
  });

  it("подгрузка, начатая до новой загрузки, отбрасывается", async () => {
    const more = deferred<unknown>();
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(page(["e-1"], "c-1"))
      .mockReturnValueOnce(more.promise)
      .mockResolvedValueOnce(page(["x"], null));
    const feed = new AgentEventFeed(fetch);

    await feed.load();
    const older = feed.loadMore();

    await feed.load();
    more.resolve(page(["old"], "c-2"));
    await older;

    expect(feed.items.map(e => e.id)).toEqual(["x"]);
    expect(feed.hasMore).toBe(false);
    expect(feed.isLoadingMore).toBe(false);
  });
});
