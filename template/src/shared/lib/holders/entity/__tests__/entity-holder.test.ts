import {
  cancelError,
  cancelResponse,
  deferred,
} from "../../__tests__/holder-test-utils";
import { testRuntime } from "../../__tests__/test-runtime";
import { HolderStatus } from "../../holder.types";
import { EntityHolder } from "../entity-holder";

afterEach(() => {
  testRuntime.restoreAllMocks();
  testRuntime.useRealTimers();
});

describe("EntityHolder", () => {
  it("manages initial data, empty data, setters and reset", async () => {
    const holder = new EntityHolder<number>({ initialData: 1 });

    expect(holder.isFilled).toBe(true);
    expect(holder.isReady).toBe(true);
    holder.reset();
    expect(holder.isIdle).toBe(true);
    holder.setData(2);
    expect(holder.data).toBe(2);
    expect(holder.isSuccess).toBe(true);

    await holder.fromApi(async () => ({ data: null }));
    expect(holder.isEmpty).toBe(true);
  });

  it("loads, refreshes and handles API and thrown errors", async () => {
    const fetch = testRuntime.fn(async (args: string) => ({
      data: args.length,
    }));
    const holder = new EntityHolder<number, string>({ onFetch: fetch });

    await expect(holder.load("abc")).resolves.toEqual({ data: 3, error: null });
    expect(fetch).toHaveBeenCalledWith("abc");

    const pending = deferred<{ data: number }>();
    const refresh = holder.fromApi(() => pending.promise, { refresh: true });

    expect(holder.status).toBe(HolderStatus.Refreshing);
    pending.resolve({ data: 4 });
    await refresh;

    const apiError = { message: "api" };

    await expect(
      holder.fromApi(async () => ({ error: apiError })),
    ).resolves.toEqual({
      data: null,
      error: apiError,
    });
    expect(holder.error).toBe(apiError);
    await expect(
      holder.fromApi(async () => {
        throw new Error("boom");
      }),
    ).resolves.toEqual({
      data: null,
      error: { message: "boom", code: undefined },
    });
  });

  it("handles cancellation and cancels a superseded request", async () => {
    const first = deferred<{ data: number }>();
    const cancel = testRuntime.fn();

    Object.assign(first.promise, { cancel });
    const holder = new EntityHolder<number>();
    const pending = holder.fromApi(() => first.promise);
    const next = holder.fromApi(async () => ({ data: 2 }));

    expect(cancel).toHaveBeenCalledTimes(1);
    first.resolve({ data: 1 });
    await Promise.all([pending, next]);
    expect(holder.data).toBe(2);
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

  it("warns when no fetch function is configured", async () => {
    const warn = testRuntime
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const holder = new EntityHolder<number>();

    await expect(holder.load()).resolves.toEqual({ data: null, error: null });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("covers every configured fetch result", async () => {
    const results = [
      cancelResponse,
      { error: { message: "api" } },
      { data: null },
    ];
    const holder = new EntityHolder<number>({
      onFetch: async () => results.shift()!,
    });

    await expect(holder.load()).resolves.toEqual({ data: null, error: null });
    await expect(holder.load()).resolves.toMatchObject({
      error: { message: "api" },
    });
    await expect(holder.load()).resolves.toEqual({ data: null, error: null });

    const thrown = new EntityHolder<number>({
      onFetch: async () => {
        throw new Error("boom");
      },
    });

    await expect(thrown.load()).resolves.toMatchObject({
      error: { message: "boom" },
    });
    const canceled = new EntityHolder<number>({
      onFetch: async () => {
        throw cancelError;
      },
    });

    await expect(canceled.load()).resolves.toEqual({ data: null, error: null });
  });

  it("applies only the latest response when async wrappers lose cancel", async () => {
    const responses = [1, 2, 3].map(() => deferred<{ data: number }>());
    const holder = new EntityHolder<number, number>({
      onFetch: async id => await responses[id - 1].promise,
    });
    const calls = [holder.load(1), holder.load(2), holder.load(3)];

    responses[0].resolve({ data: 1 });
    responses[2].resolve({ data: 3 });
    await calls[2];
    responses[1].resolve({ data: 2 });

    await expect(calls[1]).resolves.toEqual({ data: null, error: null });
    await calls[0];
    expect(holder.data).toBe(3);
    expect(holder.isSuccess).toBe(true);
  });

  it("ignores a stale error and keeps the latest pending request cancellable", async () => {
    const stale = deferred<{ error: { message: string } }>();
    const latest = deferred<{ data: number }>();
    const cancel = testRuntime.fn();

    Object.assign(latest.promise, { cancel });
    const holder = new EntityHolder<number>();
    const first = holder.fromApi(async () => await stale.promise);

    holder.fromApi(() => latest.promise).then();
    stale.resolve({ error: { message: "stale" } });
    await first;
    expect(holder.isLoading).toBe(true);
    expect(holder.error).toBeNull();
    holder.fromApi(async () => ({ data: 5 })).then();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("restores status after the latest request is canceled", async () => {
    const holder = new EntityHolder<number>({
      onFetch: async () => cancelResponse,
    });

    await holder.load();
    expect(holder.isIdle).toBe(true);
    holder.setData(7);
    await holder.refresh();
    expect(holder.isSuccess).toBe(true);
    expect(holder.data).toBe(7);
    await holder.fromApi(async () => {
      throw cancelError;
    });
    expect(holder.isSuccess).toBe(true);
  });

  it("treats a synchronous throw of the request function as an error", async () => {
    const holder = new EntityHolder<number>();

    await expect(
      holder.fromApi(() => {
        throw new Error("sync");
      }),
    ).resolves.toMatchObject({ error: { message: "sync" } });
    expect(holder.isError).toBe(true);
  });

  it("ignores an error thrown by a superseded request", async () => {
    const stale = deferred<{ data: number }>();
    const holder = new EntityHolder<number>();
    const first = holder.fromApi(() => stale.promise);

    await holder.fromApi(async () => ({ data: 2 }));
    stale.reject(new Error("stale"));
    await expect(first).resolves.toEqual({ data: null, error: null });
    expect(holder.data).toBe(2);
    expect(holder.isSuccess).toBe(true);
  });
});
