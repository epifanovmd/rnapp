import "../../__tests__/react-test-setup";

import { renderHook } from "../../__tests__/hook-probe";
import { useLatestFn } from "../use-latest-fn";

type Fn = (value: number) => number;

describe("useLatestFn", () => {
  it("returns a stable wrapper that calls the latest function", async () => {
    const hook = await renderHook(() =>
      useLatestFn<Fn>((value: number) => value + 1),
    );
    const stable = hook.current;

    await hook.rerender(() => useLatestFn<Fn>((value: number) => value * 10));
    expect(hook.current).toBe(stable);
    expect(stable?.(2)).toBe(20);

    await hook.rerender(() => useLatestFn<Fn>(undefined));
    expect(stable?.(3)).toBe(30);
    await hook.unmount();
  });

  it("returns undefined when no function is given on the first render", async () => {
    const hook = await renderHook(() => useLatestFn<Fn>(undefined));

    expect(hook.current).toBeUndefined();
    await hook.unmount();
  });
});
