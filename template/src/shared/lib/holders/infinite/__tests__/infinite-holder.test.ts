import {
  cancelError,
  cancelResponse,
  item,
  type TestItem as Item,
} from "../../__tests__/holder-test-utils";
import { testRuntime } from "../../__tests__/test-runtime";
import { MutationStatus } from "../../holder.types";
import { InfiniteHolder } from "../infinite-holder";

afterEach(() => {
  testRuntime.restoreAllMocks();
  testRuntime.useRealTimers();
});

describe("InfiniteHolder", () => {
  it("loads, refreshes and appends pages", async () => {
    const fetch = testRuntime.fn(
      async ({ offset, limit }: { offset: number; limit: number }) => ({
        data: { data: [item(offset), item(offset + 1)].slice(0, limit) },
      }),
    );
    const holder = new InfiniteHolder<Item, string>({
      onFetch: fetch,
      pageSize: 2,
      keyExtractor: value => value.id,
    });

    await holder.load("query");
    expect(holder.hasMore).toBe(true);
    await holder.loadMore();
    expect(holder.items.map(value => value.id)).toEqual([0, 1, 2, 3]);
    expect(holder.loadMoreStatus).toBe(MutationStatus.Success);
    await holder.refresh("next");
    holder.prependItem(item(8));
    holder.appendItem(item(9));
    holder.removeItem(8);
    holder.reset();
    expect(holder.isIdle).toBe(true);
  });

  it("guards loadMore and supports fromApi modes", async () => {
    const holder = new InfiniteHolder<Item>({ pageSize: 2 });

    await expect(holder.loadMore()).resolves.toMatchObject({ data: [] });
    const extract = (
      value: { rows: Item[] },
      offset: number,
      limit: number,
    ) => ({
      items: value.rows.slice(offset, offset + limit),
      hasMore: true,
    });

    await holder.fromApi(
      async () => ({ data: { rows: [item(1), item(2)] } }),
      extract,
    );
    await holder.fromApi(
      async () => ({ data: { rows: [item(3), item(4), item(5), item(6)] } }),
      extract,
      { append: true },
    );
    expect(holder.items.map(value => value.id)).toEqual([1, 2, 5, 6]);
    await holder.fromApi(async () => ({ data: null }), extract, {
      append: true,
    });
    expect(holder.hasMore).toBe(false);
    await holder.fromApi(async () => ({ data: null }), extract, {
      refresh: true,
    });
    expect(holder.items).toEqual([]);
  });

  it("handles API errors, thrown errors and cancellation for initial and append requests", async () => {
    const holder = new InfiniteHolder<Item>();
    const extract = () => ({ items: [] as Item[], hasMore: false });
    const error = { message: "api" };

    await expect(
      holder.fromApi(async () => ({ error }), extract),
    ).resolves.toMatchObject({ error });
    holder.setItems([item(1)], true);
    await expect(
      holder.fromApi(async () => ({ error }), extract, { append: true }),
    ).resolves.toMatchObject({ error });
    expect(holder.isLoadMoreError).toBe(true);
    await expect(
      holder.fromApi(async () => {
        throw new Error("boom");
      }, extract),
    ).resolves.toMatchObject({ error: { message: "boom" } });
    holder.setItems([item(1)], true);
    await expect(
      holder.fromApi(
        async () => {
          throw new Error("append");
        },
        extract,
        { append: true },
      ),
    ).resolves.toMatchObject({ error: { message: "append" } });
    await expect(
      holder.fromApi(async () => cancelResponse, extract),
    ).resolves.toMatchObject({ error: null });
    await expect(
      holder.fromApi(async () => {
        throw cancelError;
      }, extract),
    ).resolves.toMatchObject({ error: null });
  });

  it("handles configured fetch failures and warns without one", async () => {
    const responses = [
      { error: { message: "api" } },
      Promise.reject(new Error("boom")),
    ];
    const holder = new InfiniteHolder<Item>({
      onFetch: async () => await responses.shift()!,
    });

    await expect(holder.load()).resolves.toMatchObject({
      error: { message: "api" },
    });
    await expect(holder.refresh()).resolves.toMatchObject({
      error: { message: "boom" },
    });
    const warn = testRuntime
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    await new InfiniteHolder<Item>().load();
    expect(warn).toHaveBeenCalled();
  });

  it("covers configured infinite cancellation, empty and append failures", async () => {
    const responses = [
      cancelResponse,
      { data: null },
      { error: { message: "append" } },
    ];
    const holder = new InfiniteHolder<Item>({
      onFetch: async () => responses.shift()!,
    });

    await expect(holder.load()).resolves.toMatchObject({ error: null });
    await expect(holder.load()).resolves.toMatchObject({ data: [] });
    holder.setItems([item(1)], true);
    await expect(holder.loadMore()).resolves.toMatchObject({
      error: { message: "append" },
    });

    const canceled = new InfiniteHolder<Item>({
      onFetch: async () => {
        throw cancelError;
      },
    });

    await expect(canceled.load()).resolves.toMatchObject({ error: null });
    const appendThrown = new InfiniteHolder<Item>({
      onFetch: async () => {
        throw new Error("append");
      },
    });

    appendThrown.setItems([item(1)], true);
    await expect(appendThrown.loadMore()).resolves.toMatchObject({
      error: { message: "append" },
    });

    const emptyAppend = new InfiniteHolder<Item>({
      onFetch: async () => ({ data: null }),
    });

    emptyAppend.setItems([item(1)], true);
    await emptyAppend.loadMore();
    expect(emptyAppend.hasMore).toBe(false);

    const missingItems = new InfiniteHolder<Item>({
      onFetch: async () => ({ data: { data: undefined as unknown as Item[] } }),
    });

    await missingItems.load();
    expect(missingItems.items).toEqual([]);
  });
});
