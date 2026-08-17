import "../../__tests__/react-test-setup";

import { act } from "react-test-renderer";

import { renderHook } from "../../__tests__/hook-probe";
import { testRuntime } from "../../__tests__/test-runtime";
import { useWatchEffect } from "../../hooks/watch-effect";
import { usePolling } from "../use-polling-holder";

describe("Polling React integration", () => {
  it("auto-starts and cleans up polling", async () => {
    testRuntime.useFakeTimers();
    const query = testRuntime.fn(async () => ({ data: 1 }));
    const hook = await renderHook(() =>
      usePolling<number, void>({
        queryFn: query,
        interval: 5,
        autoStart: true,
      }),
    );

    await act(async () => undefined);
    expect(hook.current.isPolling).toBe(true);
    Object.values(hook.current);
    hook.current.stop();
    hook.current.start({ interval: 5 });
    await testRuntime.advanceTimersByTimeAsync(5);
    await hook.current.load();
    await hook.current.refresh();
    hook.current.reset();
    await hook.unmount();
  });

  it("passes auto-start arguments to polling", async () => {
    const query = testRuntime.fn(async (value: string) => ({ data: value }));
    const hook = await renderHook(() =>
      usePolling({ queryFn: query, autoStart: "argument" }),
    );

    await act(async () => undefined);
    expect(query).toHaveBeenCalledWith("argument");
    await hook.unmount();
  });

  it("supports hook defaults without options", async () => {
    const polling = await renderHook(() => usePolling<number>());

    await polling.unmount();
    const watch = await renderHook(() => useWatchEffect(() => undefined));

    await watch.unmount();
  });
});
