import type { IAgentEventDto } from "@shared/api/gen/main/model";

import { AgentEventFeed } from "../agent-event-feed";

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
