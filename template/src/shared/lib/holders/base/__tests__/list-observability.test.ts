import { isObservable, reaction } from "mobx";

import { CollectionHolder } from "../../collection/collection-holder";
import {
  cursorItem as item,
  cursorOptions as options,
  type CursorTestItem as Item,
  MemoryCache,
} from "../../cursor/__tests__/cursor-test-utils";
import { SyncCursorHolder } from "../../cursor/sync-cursor-holder";

interface IRow {
  id: string;
  tags: string[];
  meta: { count: number };
}

const row = (id: string): IRow => ({ id, tags: ["a"], meta: { count: 1 } });

describe("список holder-а — ссылка, а не глубокий observable", () => {
  it("элементы и их вложенные данные не превращаются в observable", () => {
    const holder = new CollectionHolder<IRow>({ keyExtractor: r => r.id });

    holder.setItems([row("1"), row("2")]);
    holder.updateItem("1", { ...row("1"), meta: { count: 2 } });

    expect(isObservable(holder.items[0])).toBe(false);
    expect(isObservable(holder.items[0].tags)).toBe(false);
    expect(isObservable(holder.items[1].meta)).toBe(false);
  });

  it("замена списка по-прежнему уведомляет наблюдателей", () => {
    const holder = new CollectionHolder<IRow>({ keyExtractor: r => r.id });
    const seen: number[] = [];
    const dispose = reaction(
      () => holder.items,
      items => seen.push(items.length),
    );

    holder.setItems([row("1")]);
    holder.appendItem(row("2"));
    holder.removeItem("1");
    dispose();

    expect(seen).toEqual([1, 2, 1]);
  });

  it("буфер новых элементов sync-курсора уведомляет и не глубокий", () => {
    const holder = new SyncCursorHolder<Item>(
      { fetch: async () => ({ data: [], hasMore: false, hasNewer: false }) },
      options,
      new MemoryCache<Item>(),
    );
    const seen: number[] = [];
    const dispose = reaction(
      () => holder.pendingItems,
      pending => seen.push(pending.length),
    );

    holder.bufferPendingItem(item(1));
    holder.bufferPendingItem(item(2));
    dispose();

    expect(seen).toEqual([1, 2]);
    expect(isObservable(holder.pendingItems[0])).toBe(false);
  });
});
