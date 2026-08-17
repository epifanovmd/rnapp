import { HolderStatus } from "../../holder.types";
import { CursorHolder } from "../cursor-holder";
import {
  cursorItem as item,
  cursorOptions as options,
  type CursorTestItem as Item,
} from "./cursor-test-utils";

describe("CursorHolder", () => {
  it("manages cursors, deduplication, directional states and reset", () => {
    const holder = new CursorHolder<Item>({
      keyExtractor: options.keyExtractor,
      limit: 2,
    });

    expect(holder.limit).toBe(2);
    expect(holder.newestCursor).toBeNull();
    expect(holder.oldestCursor).toBeNull();
    holder.setItems([item(2), item(3)], true, true);
    holder.setItems([item(2), item(3)], true);
    expect(holder.newestCursor).toBe("2");
    expect(holder.oldestCursor).toBe("3");
    holder.appendItems([item(3), item(4)], false);
    holder.prependItems([item(1), item(2)], false);
    expect(holder.items.map(value => value.id)).toEqual(["1", "2", "3", "4"]);
    holder.setLoadingOlder();
    holder.setLoadingNewer();
    expect(holder.isLoadingMore).toBe(true);
    expect(holder.isLoadingNewer).toBe(true);
    holder.setOlderError({ message: "older" });
    holder.setNewerError({ message: "newer" });
    expect(holder.isLoadMoreError).toBe(true);
    expect(holder.isLoadNewerError).toBe(true);
    holder.prependItem(item(0));
    holder.appendItem(item(5));
    holder.removeItem("0");
    holder.reset();
    expect(holder.status).toBe(HolderStatus.Idle);
    expect(holder.items).toEqual([]);
  });
});
