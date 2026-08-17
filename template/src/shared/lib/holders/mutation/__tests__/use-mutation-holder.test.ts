import "../../__tests__/react-test-setup";

import { renderHook } from "../../__tests__/hook-probe";
import { testRuntime } from "../../__tests__/test-runtime";
import { useMutation } from "../use-mutation-holder";

describe("Mutation React integration", () => {
  it("runs mutation callbacks and throws from mutateAsync", async () => {
    const onSuccess = testRuntime.fn();
    const onError = testRuntime.fn();
    const onSettled = testRuntime.fn();
    const hook = await renderHook(() =>
      useMutation<number, string>({
        mutationFn: async value =>
          value > 0
            ? { data: String(value) }
            : { error: { message: "invalid" } },
        onSuccess,
        onError,
        onSettled,
      }),
    );

    await expect(hook.current.mutate(1)).resolves.toBe("1");
    Object.values(hook.current);
    expect(onSuccess).toHaveBeenCalledWith("1");
    await expect(hook.current.mutate(-1)).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith({ message: "invalid" });
    await expect(hook.current.mutateAsync(2)).resolves.toBe("2");
    await expect(hook.current.mutateAsync(-2)).rejects.toEqual({
      message: "invalid",
    });
    const empty = await renderHook(() =>
      useMutation<void, string>({ mutationFn: async () => ({ data: null }) }),
    );

    await expect(empty.current.mutate()).resolves.toBeUndefined();
    await empty.unmount();
    expect(hook.current.isBusy).toBe(false);
    hook.current.reset();
    expect(onSettled).toHaveBeenCalledTimes(4);
    await hook.unmount();
  });

  it("updates mutation callbacks without replacing its holder", async () => {
    const first = testRuntime.fn();
    const second = testRuntime.fn();
    const mutationFn = async () => ({ data: "done" });
    const hook = await renderHook(() =>
      useMutation({ mutationFn, onSuccess: first }),
    );
    const holder = hook.current.holder;

    await hook.rerender(() => useMutation({ mutationFn, onSuccess: second }));
    await hook.current.mutate();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("done");
    expect(hook.current.holder).toBe(holder);
    await hook.unmount();
  });
});
