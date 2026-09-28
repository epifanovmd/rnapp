import { cancelError, cancelResponse } from "../../__tests__/holder-test-utils";
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
    });
    await expect(
      holder.run(async () => {
        throw cancelError;
      }),
    ).resolves.toEqual({ data: null, error: null });
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
    ).resolves.toEqual({ data: null, error: null });
    await expect(
      holder.execute(undefined, async () => {
        throw cancelError;
      }),
    ).resolves.toEqual({ data: null, error: null });
    await expect(
      holder.execute(undefined, async () => {
        throw new Error("execute");
      }),
    ).resolves.toMatchObject({ error: { message: "execute" } });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
