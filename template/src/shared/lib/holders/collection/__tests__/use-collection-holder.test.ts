import "../../__tests__/react-test-setup";

import { act } from "react-test-renderer";

import { renderHook } from "../../__tests__/hook-probe";
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
});
