import {
  cancelError,
  cancelResponse,
  item,
  type TestItem as Item,
} from "../../__tests__/holder-test-utils";
import { testRuntime } from "../../__tests__/test-runtime";
import { PagedHolder } from "../paged-holder";

afterEach(() => {
  testRuntime.restoreAllMocks();
  testRuntime.useRealTimers();
});

describe("PagedHolder", () => {
  it("manages pagination, items and page navigation", async () => {
    const fetch = testRuntime.fn(
      async ({ offset, limit }: { offset: number; limit: number }) => ({
        data: { data: [item(offset)], totalCount: 5, limit },
      }),
    );
    const holder = new PagedHolder<Item, string>({
      onFetch: fetch,
      pageSize: 2,
      keyExtractor: value => value.id,
    });

    await holder.load("query");
    expect(holder.pageCount).toBe(3);
    expect(holder.hasNextPage).toBe(true);
    expect(holder.offset).toBe(0);
    await holder.nextPage();
    expect(holder.pagination.page).toBe(2);
    expect(holder.hasPrevPage).toBe(true);
    await holder.prevPage();
    await holder.goToPage(99, { refresh: true });
    expect(holder.pagination.page).toBe(3);
    holder.setPage(-1);
    holder.setPageSize(0);
    expect(holder.pageCount).toBe(1);
    holder.setPagination({ pageSize: 2, totalCount: 1 });
    holder.prependItem(item(8));
    holder.appendItem(item(9));
    holder.removeItem(8);
    expect(holder.pagination.totalCount).toBe(2);
    holder.reset();
    expect(holder.pagination.page).toBe(1);
  });

  it("returns existing data at page boundaries", async () => {
    const holder = new PagedHolder<Item>();

    holder.setItems([item(1)], 1);
    await expect(holder.nextPage()).resolves.toMatchObject({ data: [item(1)] });
    await expect(holder.prevPage()).resolves.toMatchObject({ data: [item(1)] });
  });

  it("supports fromApi and failure branches", async () => {
    const holder = new PagedHolder<Item>();
    const extract = (value: { rows: Item[] }) => ({
      items: value.rows,
      totalCount: 4,
    });

    await expect(
      holder.fromApi(async () => ({ data: { rows: [item(1)] } }), extract),
    ).resolves.toEqual({
      data: [item(1)],
      totalCount: 4,
      error: null,
    });
    await expect(
      holder.fromApi(async () => ({ data: null }), extract, { refresh: true }),
    ).resolves.toEqual({
      data: [],
      totalCount: 0,
      error: null,
    });
    const error = { message: "api" };

    await expect(
      holder.fromApi(async () => ({ error }), extract),
    ).resolves.toMatchObject({ error });
    await expect(
      holder.fromApi(async () => cancelResponse, extract),
    ).resolves.toEqual({ data: null, totalCount: 0, error: null });
    await expect(
      holder.fromApi(async () => {
        throw cancelError;
      }, extract),
    ).resolves.toEqual({ data: null, totalCount: 0, error: null });
    await expect(
      holder.fromApi(async () => {
        throw new Error("boom");
      }, extract),
    ).resolves.toMatchObject({ error: { message: "boom" } });
  });

  it("handles count fallback, errors and missing onFetch", async () => {
    const responses = [
      { data: { data: [item(1)], count: 3 } },
      { error: { message: "api" } },
      null,
    ];
    const holder = new PagedHolder<Item>({
      onFetch: async () => responses.shift() ?? { data: null },
    });

    await holder.load();
    expect(holder.pagination.totalCount).toBe(3);
    await expect(holder.reload()).resolves.toMatchObject({
      error: { message: "api" },
    });
    await expect(holder.reload()).resolves.toMatchObject({ data: [] });
    const fallback = new PagedHolder<Item>({
      onFetch: async () => ({ data: { data: undefined as unknown as Item[] } }),
    });

    await fallback.load();
    expect(fallback.pagination.totalCount).toBe(0);
    const warn = testRuntime
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    await new PagedHolder<Item>().load();
    expect(warn).toHaveBeenCalled();
  });

  it("handles cancellation and thrown errors in configured paging", async () => {
    const cancelHolder = new PagedHolder<Item>({
      onFetch: async () => cancelResponse,
    });

    await expect(cancelHolder.load()).resolves.toEqual({
      data: null,
      totalCount: 0,
      error: null,
    });
    const thrown = new PagedHolder<Item>({
      onFetch: async () => {
        throw new Error("boom");
      },
    });

    await expect(thrown.load()).resolves.toMatchObject({
      error: { message: "boom" },
    });
    const canceled = new PagedHolder<Item>({
      onFetch: async () => {
        throw cancelError;
      },
    });

    await expect(canceled.load()).resolves.toEqual({
      data: null,
      totalCount: 0,
      error: null,
    });
  });
});
