import { CachedCursorHolder } from "../cached-cursor-holder";
import {
  cursorItem as item,
  cursorOptions as options,
  type CursorTestItem as Item,
  MemoryCache,
} from "./cursor-test-utils";

describe("CachedCursorHolder", () => {
  it("persists bound state and ignores persistence without cache or key", () => {
    const cache = new MemoryCache<Item>();
    const holder = new CachedCursorHolder(options, cache);
    const disabled = new CachedCursorHolder(options);

    expect(holder.isCacheEnabled).toBe(true);
    expect(disabled.isCacheEnabled).toBe(false);
    disabled.persistNow();
    expect(disabled.existsInCache("missing")).toBe(false);
    holder.setItems([item(1)], true, false);
    expect(cache.scheduled).toBeNull();
    holder.bind("feed");
    holder.appendItems([item(2)], false);
    expect(cache.scheduled?.getState()).toEqual({
      items: [item(1), item(2)],
      hasMore: false,
      hasNewer: false,
    });
    holder.markHasNewer();
    holder.replaceAllItems([item(3)]);
    holder.prependItem(item(2));
    holder.removeItem("3");
    holder.persistNow();
    expect(cache.read("feed")?.items).toEqual([item(2)]);
    expect(holder.existsInCache("2")).toBe(true);
    expect(holder.existsInCache("missing")).toBe(false);
    holder.unbind();
    expect(cache.cancelCount).toBe(1);
    holder.unbind();
  });
});
