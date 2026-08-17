import { testRuntime } from "../../__tests__/test-runtime";
import { HolderStatus, MutationStatus } from "../../holder.types";
import { type IFetchProvider } from "../cached-cursor-holder.types";
import { SyncCursorHolder } from "../sync-cursor-holder";
import {
  cursorItem as item,
  cursorOptions as options,
  type CursorTestItem as Item,
  MemoryCache,
} from "./cursor-test-utils";

describe("SyncCursorHolder", () => {
  it("hydrates cache, merges server and buffered items, and persists", async () => {
    const cache = new MemoryCache<Item>();

    cache.state.set("feed", {
      items: [item(1), item(2), item(3), item(4)],
      hasMore: true,
      hasNewer: false,
    });
    const fetch = testRuntime.fn(async (_params?: unknown) => ({
      data: [item(1, "1"), item(2, "2")],
      hasMore: false,
      hasNewer: true,
    }));
    const holder = new SyncCursorHolder({ fetch }, options, cache);
    const detach = testRuntime.fn();

    holder.bind("feed");
    const pending = holder.fetchInitial(null, "feed", detach);

    holder.bufferPendingItem(item(0));
    await pending;

    expect(fetch).toHaveBeenCalledWith({ key: "feed", limit: 3 });
    expect(holder.items.map(value => value.id)).toEqual(["0", "1", "2", "3"]);
    expect(holder.status).toBe(HolderStatus.Success);
    expect(detach).toHaveBeenCalledWith(true);
    expect(cache.scheduled).not.toBeNull();
  });

  it("loads around an anchor and handles stale, empty and failed initial requests", async () => {
    const cache = new MemoryCache<Item>();

    cache.state.set("feed", {
      items: [item(1), item(2), item(3), item(4)],
      hasMore: false,
      hasNewer: true,
    });
    const results: Array<ReturnType<IFetchProvider<Item>["fetch"]>> = [
      Promise.resolve({
        data: [item(2), item(3)],
        hasMore: true,
        hasNewer: true,
      }),
      Promise.resolve(null),
      Promise.reject(new Error("failed")),
    ];
    const holder = new SyncCursorHolder(
      { fetch: () => results.shift()! },
      options,
      cache,
    );

    await holder.fetchInitial(null, "feed");
    holder.bind("feed");
    await holder.fetchInitial({ id: "3", wasAtBottom: false }, "feed");
    expect(holder.items.length).toBeGreaterThan(0);
    await holder.fetchInitial({ id: "missing", wasAtBottom: false }, "feed");
    expect(holder.pendingItems).toEqual([]);
    await holder.fetchInitial(null, "feed");
    expect(holder.status).toBe(HolderStatus.Success);

    const noCache = new SyncCursorHolder(
      {
        fetch: async () => {
          throw new Error("failed");
        },
      },
      options,
    );

    noCache.bind("other");
    await noCache.fetchInitial(null, "other");
    expect(noCache.isError).toBe(true);
  });

  it("invalidates an in-flight initial request", async () => {
    let resolve!: (value: {
      data: Item[];
      hasMore: boolean;
      hasNewer: boolean;
    }) => void;
    const promise = new Promise<{
      data: Item[];
      hasMore: boolean;
      hasNewer: boolean;
    }>(res => {
      resolve = res;
    });
    const holder = new SyncCursorHolder({ fetch: () => promise }, options);

    holder.bind("feed");
    const pending = holder.fetchInitial(null, "feed");

    holder.bufferPendingItem(item(0));
    holder.invalidate();
    resolve({ data: [item(1)], hasMore: false, hasNewer: false });
    await pending;
    expect(holder.items).toEqual([]);
    expect(holder.pendingItems).toEqual([]);
  });

  it("loads older pages from cache and API and handles empty and errors", async () => {
    const cache = new MemoryCache<Item>();

    cache.state.set("feed", {
      items: [item(1), item(2), item(3), item(4), item(5)],
      hasMore: true,
      hasNewer: false,
    });
    const responses = [
      { data: [item(4), item(6)], hasMore: true, hasNewer: false },
      null,
      new Error("older"),
    ];
    const holder = new SyncCursorHolder(
      {
        fetch: async () => {
          const response = responses.shift();

          if (response instanceof Error) throw response;

          return response ?? null;
        },
      },
      options,
      cache,
    );

    holder.bind("feed");
    holder.setItems([item(1), item(2), item(3)], true);
    await holder.loadOlder();
    expect(holder.items.map(value => value.id)).toContain("6");
    holder.hasMore = true;
    await holder.loadOlder();
    expect(holder.hasMore).toBe(false);
    holder.hasMore = true;
    await holder.loadOlder();
    expect(holder.loadMoreStatus).toBe(MutationStatus.Error);
  });

  it("loads newer pages from cache and API and handles empty and errors", async () => {
    const cache = new MemoryCache<Item>();

    cache.state.set("feed", {
      items: [item(0), item(1), item(2), item(3)],
      hasMore: false,
      hasNewer: true,
    });
    const responses = [
      { data: [item(-1), item(0)], hasMore: false, hasNewer: true },
      { data: [], hasMore: false, hasNewer: false },
      new Error("newer"),
    ];
    const holder = new SyncCursorHolder(
      {
        fetch: async () => {
          const response = responses.shift();

          if (response instanceof Error) throw response;

          return response ?? null;
        },
      },
      options,
      cache,
    );

    holder.bind("feed");
    holder.setItems([item(1), item(2)], false, true);
    await holder.loadNewer();
    expect(holder.items.map(value => value.id)).toContain("-1");
    holder.hasNewer = true;
    await holder.loadNewer();
    expect(holder.hasNewer).toBe(false);
    holder.hasNewer = true;
    await holder.loadNewer();
    expect(holder.loadNewerStatus).toBe(MutationStatus.Error);
  });

  it("navigates through current items, cache and API", async () => {
    const cache = new MemoryCache<Item>();

    cache.state.set("feed", {
      items: [item(1), item(2), item(3)],
      hasMore: false,
      hasNewer: false,
    });
    const responses = [
      { data: [item(9)], hasMore: true, hasNewer: true },
      { data: [], hasMore: false, hasNewer: false },
      { data: [item(10)], hasMore: false, hasNewer: false },
    ];
    const holder = new SyncCursorHolder(
      { fetch: async () => responses.shift() ?? null },
      options,
      cache,
    );

    expect(await holder.navigateToItem("1", "feed")).toBe(false);
    holder.bind("feed");
    holder.setItems([item(1)], false);
    expect(await holder.navigateToItem("1", "feed")).toBe(true);
    expect(await holder.navigateToItem("2", "feed")).toBe(true);
    expect(await holder.navigateToItem("9", "feed")).toBe(true);
    expect(await holder.navigateToItem("missing", "feed")).toBe(false);
    expect(await holder.navigateToItem("missing", "wrong-key")).toBe(false);

    const failing = new SyncCursorHolder(
      {
        fetch: async () => {
          throw new Error("failed");
        },
      },
      options,
    );

    failing.bind("feed");
    expect(await failing.navigateToItem("1", "feed")).toBe(false);
  });

  it("guards directional loads when prerequisites are missing", async () => {
    const api = { fetch: testRuntime.fn(async () => null) };
    const holder = new SyncCursorHolder(api, options);

    await holder.loadOlder();
    await holder.loadNewer();
    holder.bind("feed");
    holder.hasMore = true;
    holder.hasNewer = true;
    await holder.loadOlder();
    await holder.loadNewer();
    expect(api.fetch).not.toHaveBeenCalled();
  });

  it("loads initial and directional API data without cache windows", async () => {
    const responses = [
      { data: [item(2)], hasMore: true, hasNewer: true },
      { data: [item(3)], hasMore: false, hasNewer: true },
      { data: [item(1)], hasMore: false, hasNewer: false },
    ];
    const holder = new SyncCursorHolder(
      { fetch: async () => responses.shift() ?? null },
      options,
    );

    holder.bind("feed");
    await holder.fetchInitial(null, "feed");
    await holder.loadOlder();
    await holder.loadNewer();
    expect(holder.items.map(value => value.id)).toEqual(["1", "2", "3"]);
  });

  it("uses default limits and rejects API navigation without the target", async () => {
    const fetch = testRuntime.fn(async (_params?: unknown) => ({
      data: [item(2)],
      hasMore: false,
      hasNewer: false,
    }));
    const holder = new SyncCursorHolder(
      { fetch },
      {
        keyExtractor: options.keyExtractor,
        idExtractor: options.idExtractor,
        sort: options.sort,
      },
    );

    holder.bind("feed");
    await holder.fetchInitial(null, "feed");
    holder.reset();
    expect(await holder.navigateToItem("missing", "feed")).toBe(false);
    expect(fetch).toHaveBeenCalledWith({ key: "feed", limit: 50 });
  });

  it("combines a short cached window with the cache hasMore flag", async () => {
    const cache = new MemoryCache<Item>();

    cache.state.set("feed", {
      items: [item(1)],
      hasMore: true,
      hasNewer: false,
    });
    const holder = new SyncCursorHolder(
      { fetch: async () => null },
      options,
      cache,
    );

    holder.bind("feed");
    await holder.fetchInitial(null, "feed");
    expect(holder.hasMore).toBe(true);
  });
});
