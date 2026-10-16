import {
  cancelError,
  cancelResponse,
  deferred,
} from "../../__tests__/holder-test-utils";
import { testRuntime } from "../../__tests__/test-runtime";
import { MutationHolder } from "../mutation-holder";

afterEach(() => {
  testRuntime.restoreAllMocks();
  testRuntime.useRealTimers();
});

describe("MutationHolder", () => {
  it("executes configured and inline mutations", async () => {
    const holder = new MutationHolder<number, string>({
      onMutate: async value => ({ data: String(value) }),
    });

    await expect(holder.execute(2)).resolves.toEqual({
      data: "2",
      error: null,
    });
    expect(holder.isSuccess).toBe(true);
    await expect(
      holder.execute(3, async value => ({ data: `inline-${value}` })),
    ).resolves.toMatchObject({ data: "inline-3" });
    await expect(
      holder.run(async () => ({ data: "run" })),
    ).resolves.toMatchObject({ data: "run" });
    holder.reset();
    expect(holder.isIdle).toBe(true);
  });

  it("handles errors, empty data, cancellation and missing functions", async () => {
    const holder = new MutationHolder<void, string>();
    const warn = testRuntime
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    await expect(holder.execute()).resolves.toEqual({
      data: null,
      error: null,
    });
    const error = { message: "api" };

    await expect(holder.run(async () => ({ error }))).resolves.toMatchObject({
      error,
    });
    expect(holder.isError).toBe(true);
    await expect(holder.run(async () => ({ data: null }))).resolves.toEqual({
      data: null,
      error: null,
    });
    await expect(holder.run(async () => cancelResponse)).resolves.toEqual({
      data: null,
      error: null,
      isCanceled: true,
    });
    await expect(
      holder.run(async () => {
        throw cancelError;
      }),
    ).resolves.toEqual({ data: null, error: null, isCanceled: true });
    await expect(
      holder.run(async () => {
        throw new Error("boom");
      }),
    ).resolves.toMatchObject({ error: { message: "boom" } });
    await expect(
      holder.execute(undefined, async () => ({ error })),
    ).resolves.toMatchObject({ error });
    await expect(
      holder.execute(undefined, async () => ({ data: null })),
    ).resolves.toEqual({ data: null, error: null });
    await expect(
      holder.execute(undefined, async () => cancelResponse),
    ).resolves.toEqual({ data: null, error: null, isCanceled: true });
    await expect(
      holder.execute(undefined, async () => {
        throw cancelError;
      }),
    ).resolves.toEqual({ data: null, error: null, isCanceled: true });
    await expect(
      holder.execute(undefined, async () => {
        throw new Error("execute");
      }),
    ).resolves.toMatchObject({ error: { message: "execute" } });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("applies only the result of the latest call", async () => {
    const slow = deferred<{ error: { message: string } }>();
    const holder = new MutationHolder<number, string>();
    const first = holder.execute(1, async () => await slow.promise);

    await holder.execute(2, async value => ({ data: String(value) }));
    slow.resolve({ error: { message: "stale" } });
    await expect(first).resolves.toEqual({
      data: null,
      error: { message: "stale" },
    });
    expect(holder.isSuccess).toBe(true);
    expect(holder.error).toBeNull();
    expect(holder.data).toBe("2");

    const thrown = deferred<{ data: string }>();
    const second = holder.run(() => thrown.promise);

    await holder.run(async () => ({ data: "latest" }));
    thrown.reject(new Error("stale"));
    await expect(second).resolves.toMatchObject({
      error: { message: "stale" },
    });
    expect(holder.isSuccess).toBe(true);
    expect(holder.data).toBe("latest");

    const canceled = deferred<typeof cancelResponse>();
    const third = holder.run(() => canceled.promise);
    const pending = holder.run(() => new Promise(() => undefined));

    canceled.resolve(cancelResponse);
    await expect(third).resolves.toMatchObject({ isCanceled: true });
    expect(holder.isLoading).toBe(true);
    expect(pending).toBeInstanceOf(Promise);
  });

  it("marks canceled results and restores status after the latest call is canceled", async () => {
    const holder = new MutationHolder<void, string>();

    await expect(
      holder.execute(undefined, async () => cancelResponse),
    ).resolves.toEqual({ data: null, error: null, isCanceled: true });
    expect(holder.isIdle).toBe(true);
    await holder.run(async () => ({ data: "saved" }));
    await expect(
      holder.run(async () => {
        throw cancelError;
      }),
    ).resolves.toEqual({ data: null, error: null, isCanceled: true });
    expect(holder.isSuccess).toBe(true);
    expect(holder.data).toBe("saved");
  });

  it("does not apply a stale successful result over a pending call", async () => {
    const stale = deferred<{ data: string }>();
    const holder = new MutationHolder<void, string>();
    const first = holder.run(() => stale.promise);

    holder.run(() => new Promise(() => undefined)).then();
    stale.resolve({ data: "stale" });
    await expect(first).resolves.toEqual({ data: "stale", error: null });
    expect(holder.isLoading).toBe(true);
    expect(holder.data).toBeNull();
  });
});
