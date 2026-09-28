import {
  cancelError,
  cancelResponse,
  item,
  type TestItem as Item,
} from "../../__tests__/holder-test-utils";
import { testRuntime } from "../../__tests__/test-runtime";
import { CollectionHolder } from "../collection-holder";

afterEach(() => {
  testRuntime.restoreAllMocks();
  testRuntime.useRealTimers();
});

describe("CollectionHolder", () => {
  it("supports collection mutations and key predicates", () => {
    const holder = new CollectionHolder<Item>({
      keyExtractor: value => value.id,
    });

    holder.setItems([item(1), item(2)]);
    holder.prependItem(item(0));
    holder.appendItem(item(3));
    holder.updateItem(1, { id: 1, name: "updated" });
    holder.upsertItem(2, { id: 2, name: "upserted" });
    holder.upsertItem(4, item(4));
    holder.appendIfNotExists(4, item(4));
    holder.appendIfNotExists(6, item(6));
    holder.prependIfNotExists(5, item(5));
    holder.prependIfNotExists(5, item(5));

    expect(holder.count).toBe(7);
    expect(holder.isEmpty).toBe(false);
    expect(holder.exists(1)).toBe(true);
    expect(holder.get(value => value.id === 2)?.name).toBe("upserted");
    holder.removeItem(0);
    expect(holder.exists(0)).toBe(false);
    holder.reset();
    expect(holder.items).toEqual([]);
  });

  it("rejects scalar predicates without a key extractor", () => {
    const holder = new CollectionHolder<Item>();

    expect(() => holder.exists(1)).toThrow("keyExtractor must be configured");
  });

  it("loads, refreshes, extracts data and handles all result branches", async () => {
    const fetch = testRuntime.fn(async () => ({ data: [item(1)] }));
    const holder = new CollectionHolder<Item>({ onFetch: fetch });

    await expect(holder.load()).resolves.toEqual({
      data: [item(1)],
      error: null,
    });
    await holder.refresh();
    await expect(
      holder.fromApi(
        async () => ({ data: { values: [item(2)] } }),
        value => value.values,
      ),
    ).resolves.toEqual({ data: [item(2)], error: null });
    await holder.fromApi(async () => ({ data: [item(3)] }), undefined, {
      refresh: true,
    });
    await expect(holder.fromApi(async () => ({ data: null }))).resolves.toEqual(
      {
        data: [],
        error: null,
      },
    );
    const error = { message: "api" };

    await expect(holder.fromApi(async () => ({ error }))).resolves.toEqual({
      data: null,
      error,
    });
    await expect(
      holder.fromApi(async () => {
        throw new Error("boom");
      }),
    ).resolves.toMatchObject({ data: null, error: { message: "boom" } });
    await expect(holder.fromApi(async () => cancelResponse)).resolves.toEqual({
      data: null,
      error: null,
    });
    await expect(
      holder.fromApi(async () => {
        throw cancelError;
      }),
    ).resolves.toEqual({ data: null, error: null });
  });

  it("warns without onFetch", async () => {
    const warn = testRuntime
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    await new CollectionHolder<Item>().load();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("covers every configured collection fetch result", async () => {
    const results = [
      cancelResponse,
      { error: { message: "api" } },
      { data: null },
    ];
    const holder = new CollectionHolder<Item>({
      onFetch: async () => results.shift()!,
    });

    await expect(holder.load()).resolves.toEqual({ data: null, error: null });
    await expect(holder.load()).resolves.toMatchObject({
      error: { message: "api" },
    });
    await expect(holder.load()).resolves.toEqual({ data: [], error: null });
    const thrown = new CollectionHolder<Item>({
      onFetch: async () => {
        throw new Error("boom");
      },
    });

    await expect(thrown.load()).resolves.toMatchObject({
      error: { message: "boom" },
    });
    const canceled = new CollectionHolder<Item>({
      onFetch: async () => {
        throw cancelError;
      },
    });

    await expect(canceled.load()).resolves.toEqual({ data: null, error: null });
  });
});
