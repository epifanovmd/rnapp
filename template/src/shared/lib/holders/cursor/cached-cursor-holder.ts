import { action, makeObservable } from "mobx";

import { IHolderError } from "../holder.types";
import {
  ICachedCursorHolderOptions,
  ICacheProvider,
  ICacheState,
} from "./cached-cursor-holder.types";
import { CursorHolder } from "./cursor-holder";

export class CachedCursorHolder<
  TItem,
  TError extends IHolderError = IHolderError,
> extends CursorHolder<TItem, TError> {
  protected _cache: ICacheProvider<TItem> | null;
  protected _idExtractor: (item: TItem) => string;
  protected _sort: (a: TItem, b: TItem) => number;
  protected _boundKey: string | null = null;

  constructor(
    options: ICachedCursorHolderOptions<TItem>,
    cache?: ICacheProvider<TItem>,
  ) {
    super(options);
    this._cache = cache ?? null;
    this._idExtractor = options.idExtractor;
    this._sort = options.sort;

    makeObservable(this, {
      bind: action,
      unbind: action,
      markHasNewer: action,
      replaceAllItems: action,
    });
  }

  get isCacheEnabled(): boolean {
    return this._cache != null;
  }

  bind(key: string): void {
    this._boundKey = key;
  }

  unbind(): void {
    if (this._boundKey && this._cache) {
      this._persistNow();
      this._cache.cancelPersist();
    }
    this._boundKey = null;
  }

  persistNow(): void {
    this._persistNow();
  }

  markHasNewer(): void {
    this.hasNewer = true;
  }

  replaceAllItems(items: TItem[]): void {
    this.items = items;
    this._schedulePersist();
  }

  protected _readCache(): ICacheState<TItem> | null {
    if (!this._boundKey || !this._cache) return null;

    return this._cache.read(this._boundKey);
  }

  existsInCache(itemId: string): boolean {
    const cached = this._readCache();

    if (!cached) return false;

    return cached.items.some(m => this._idExtractor(m) === itemId);
  }

  protected _readWindow(
    anchor: { id: string; wasAtBottom: boolean } | null,
    size: number,
  ): { items: TItem[]; hasMore: boolean; hasNewer: boolean } | null {
    const cached = this._readCache();

    if (!cached || cached.items.length === 0) return null;

    if (!anchor || anchor.wasAtBottom) {
      const end = Math.min(cached.items.length, size);
      const items = cached.items.slice(0, end);

      return {
        items,
        hasMore: end < cached.items.length || cached.hasMore,
        hasNewer: cached.hasNewer,
      };
    }

    return this._readWindowAround(anchor.id, size);
  }

  protected _readWindowAround(
    itemId: string,
    windowSize: number,
  ): { items: TItem[]; hasMore: boolean; hasNewer: boolean } | null {
    const cached = this._readCache();

    if (!cached) return null;

    const idx = cached.items.findIndex(m => this._idExtractor(m) === itemId);

    if (idx === -1) return null;

    const half = Math.floor(windowSize / 2);
    const start = Math.max(0, idx - half);
    const end = Math.min(cached.items.length, start + windowSize);
    const items = cached.items.slice(start, end);

    return {
      items,
      hasMore: end < cached.items.length || cached.hasMore,
      hasNewer: start > 0 || cached.hasNewer,
    };
  }

  protected _readOlderWindow(cursorId: string, size: number): TItem[] | null {
    const cached = this._readCache();

    if (!cached) return null;

    const idx = cached.items.findIndex(m => this._idExtractor(m) === cursorId);

    if (idx === -1 || idx >= cached.items.length - 1) return null;

    const slice = cached.items.slice(idx + 1, idx + 1 + size);

    return slice;
  }

  protected _readNewerWindow(cursorId: string, size: number): TItem[] | null {
    const cached = this._readCache();

    if (!cached) return null;

    const idx = cached.items.findIndex(m => this._idExtractor(m) === cursorId);

    if (idx <= 0) return null;

    const start = Math.max(0, idx - size);
    const slice = cached.items.slice(start, idx);

    return slice;
  }

  override setItems(
    items: TItem[],
    hasMore: boolean,
    hasNewer: boolean = false,
  ): void {
    super.setItems(items, hasMore, hasNewer);
    this._schedulePersist();
  }

  override appendItems(items: TItem[], hasMore: boolean): void {
    super.appendItems(items, hasMore);
    this._schedulePersist();
  }

  override prependItems(items: TItem[], hasNewer: boolean): void {
    super.prependItems(items, hasNewer);
    this._schedulePersist();
  }

  override prependItem(item: TItem): void {
    super.prependItem(item);
    this._schedulePersist();
  }

  override removeItem(
    predicate: ((item: TItem) => boolean) | string | number,
  ): void {
    super.removeItem(predicate);
    this._schedulePersist();
  }

  protected _normalize(items: TItem[]): TItem[] {
    const seen = new Map<string, TItem>();

    for (const m of items) seen.set(this._idExtractor(m), m);

    return Array.from(seen.values()).sort(this._sort);
  }

  protected _schedulePersist(): void {
    if (!this._boundKey || !this._cache) return;

    this._cache.schedulePersist(this._boundKey, () => ({
      items: this.items,
      hasMore: this.hasMore,
      hasNewer: this.hasNewer,
    }));
  }

  private _persistNow(): void {
    if (!this._boundKey || !this._cache) return;

    this._cache.persistNow(this._boundKey, {
      items: this.items,
      hasMore: this.hasMore,
      hasNewer: this.hasNewer,
    });
  }
}
