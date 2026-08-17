import "../../__tests__/react-test-setup";

import { act } from "react-test-renderer";

import { renderHook } from "../../__tests__/hook-probe";
import { testRuntime } from "../../__tests__/test-runtime";
import { useEntity } from "../use-entity-holder";

describe("Entity React integration", () => {
  it("keeps one EntityHolder and reacts to watched arguments", async () => {
    const query = testRuntime.fn(async (value: string) => ({
      data: value.length,
    }));
    const hook = await renderHook(() =>
      useEntity({ queryFn: query, watch: ["one"] }),
    );

    await act(async () => undefined);
    const first = hook.current.holder;

    expect(query).toHaveBeenCalledWith("one");
    Object.values(hook.current);
    expect(hook.current.data).toBe(3);
    hook.current.setData(4);
    expect(hook.current.isFilled).toBe(true);
    await hook.current.refresh("two");
    await hook.current.fromApi(async () => ({ data: 5 }));
    hook.current.reset();
    await hook.rerender(() =>
      useEntity({ queryFn: query, watch: ["next"], enabled: false }),
    );
    expect(hook.current.holder).toBe(first);
    await hook.unmount();
  });
});
