import { MutationHolder } from "../mutation-holder";
import { runMutation } from "../run-mutation";

describe("runMutation", () => {
  it("returns typed data and leaves the holder in success state", async () => {
    const holder = new MutationHolder<void, unknown>();
    const res = await runMutation<{ id: number }>(holder, async () => ({
      data: { id: 1 },
    }));

    expect(res).toEqual({ data: { id: 1 }, error: null });
    expect(holder.isSuccess).toBe(true);
  });

  it("maps a missing body to null and passes errors through", async () => {
    const holder = new MutationHolder<void, unknown>();

    expect(
      await runMutation<void>(holder, async () => ({ data: undefined })),
    ).toEqual({
      data: null,
      error: null,
    });

    const failed = await runMutation<void>(holder, async () => ({
      error: { message: "nope" },
    }));

    expect(failed.data).toBeNull();
    expect(failed.error?.message).toBe("nope");
    expect(holder.isError).toBe(true);
  });
});
