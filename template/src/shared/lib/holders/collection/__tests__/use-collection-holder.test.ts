import "../../__tests__/react-test-setup";

import { act } from "react-test-renderer";

import { renderHook } from "../../__tests__/hook-probe";
import { testRuntime } from "../../__tests__/test-runtime";
import { useCollection } from "../use-collection-holder";

describe("Collection React integration", () => {
  it("exposes collection methods and reactive getters", async () => {
    const hook = await renderHook(() =>
      useCollection({
        queryFn: async () => ({ data: [{ id: 1 }] }),
        keyExtractor: value => value.id,
        watch: ["load"],
      }),
    );

    await act(async () => undefined);

    expect(hook.current.count).toBe(1);
    Object.values(hook.current);
    hook.current.prependItem({ id: 0 });
    hook.current.appendItem({ id: 2 });
    hook.current.updateItem(2, { id: 3 });
    hook.current.upsertItem(4, { id: 4 });
    hook.current.removeItem(0);
    await hook.current.refresh("refresh");
    await hook.current.fromApi(async () => ({ data: [{ id: 5 }] }));
    expect(hook.current.isSuccess).toBe(true);
    hook.current.reset();
    expect(hook.current.isIdle).toBe(true);
    await hook.unmount();
  });

  it("без watch сама не грузит; autoLoad — один раз при монтировании; enabled: false — не грузит", async () => {
    const queryFn = testRuntime.fn(async () => ({ data: [{ id: 1 }] }));

    const manual = await renderHook(() => useCollection({ queryFn }));

    await act(async () => undefined);
    expect(queryFn).not.toHaveBeenCalled();
    expect(manual.current.count).toBe(0);
    await manual.unmount();

    const auto = await renderHook(() =>
      useCollection({ queryFn, autoLoad: true }),
    );

    await act(async () => undefined);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(auto.current.count).toBe(1);
    await auto.unmount();

    queryFn.mockClear();

    const disabled = await renderHook(() =>
      useCollection({ queryFn, autoLoad: true, enabled: false }),
    );

    await act(async () => undefined);
    expect(queryFn).not.toHaveBeenCalled();
    await disabled.unmount();
  });
});
