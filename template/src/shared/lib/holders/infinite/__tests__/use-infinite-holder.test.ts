import "../../__tests__/react-test-setup";

import { act } from "react-test-renderer";

import { renderHook } from "../../__tests__/hook-probe";
import { useInfinite } from "../use-infinite-holder";

describe("Infinite React integration", () => {
  it("exposes infinite loading state and methods", async () => {
    const hook = await renderHook(() =>
      useInfinite({
        queryFn: async ({ offset }) => ({ data: { data: [{ id: offset }] } }),
        pageSize: 1,
        watch: ["load"],
      }),
    );

    await act(async () => undefined);

    expect(hook.current.hasMore).toBe(true);
    Object.values(hook.current);
    await hook.current.loadMore();
    await hook.current.refresh("refresh");
    expect(hook.current.isLoadMoreError).toBe(false);
    expect(hook.current.loadMoreError).toBeNull();
    hook.current.reset();
    await hook.unmount();
  });
});
