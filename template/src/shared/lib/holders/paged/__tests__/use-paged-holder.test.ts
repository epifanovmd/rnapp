import "../../__tests__/react-test-setup";

import { act } from "react-test-renderer";

import { renderHook } from "../../__tests__/hook-probe";
import { usePaged } from "../use-paged-holder";

describe("Paged React integration", () => {
  it("exposes paged navigation and state", async () => {
    const hook = await renderHook(() =>
      usePaged({
        queryFn: async ({ offset }) => ({
          data: { data: [{ id: offset }], totalCount: 3 },
        }),
        keyExtractor: value => value.id,
        pageSize: 1,
        watch: ["load"],
      }),
    );

    await act(async () => undefined);

    expect(hook.current.pageCount).toBe(3);
    Object.values(hook.current);
    await hook.current.nextPage();
    await hook.current.prevPage();
    await hook.current.goToPage(2);
    await hook.current.reload({ refresh: true });
    hook.current.setPage(1);
    hook.current.setPageSize(2);
    hook.current.prependItem({ id: 8 });
    hook.current.appendItem({ id: 9 });
    hook.current.updateItem(8, { id: 7 });
    hook.current.removeItem(7);
    expect(hook.current.hasPrevPage).toBe(false);
    hook.current.reset();
    await hook.unmount();
  });
});
