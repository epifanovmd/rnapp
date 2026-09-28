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
});
