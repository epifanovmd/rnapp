import { action, computed, makeObservable, observable } from "mobx";

import { BaseListHolder } from "../base/base-list-holder";
import { HolderStatus, IHolderError, MutationStatus } from "../holder.types";

export interface ICursorHolderOptions<TItem> {
  keyExtractor: (item: TItem) => string | number;
  limit?: number;
}

export class CursorHolder<
  TItem,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  hasMore: boolean = false;
  loadMoreStatus = MutationStatus.Idle;
  loadMoreError: TError | null = null;

  hasNewer: boolean = false;
  loadNewerStatus = MutationStatus.Idle;
  loadNewerError: TError | null = null;

  private readonly _limit: number;

  constructor(options: ICursorHolderOptions<TItem>) {
    super(options.keyExtractor);

    this._limit = options.limit ?? 40;

    makeObservable(this, {
      hasMore: observable,
      loadMoreStatus: observable,
      loadMoreError: observable.ref,
      hasNewer: observable,
      loadNewerStatus: observable,
      loadNewerError: observable.ref,

      isLoadingMore: computed,
      isLoadMoreError: computed,
      isLoadingNewer: computed,
      isLoadNewerError: computed,
      newestCursor: computed,
      oldestCursor: computed,
      limit: computed,

      setItems: action,
      appendItems: action,
      prependItems: action,
      prependItem: action,
      appendItem: action,
      removeItem: action,
      setLoadingOlder: action,
      setLoadingNewer: action,
      setOlderError: action,
      setNewerError: action,
      reset: action,
    });
  }

  get isLoadingMore() {
    return this.loadMoreStatus === MutationStatus.Loading;
  }

  get isLoadMoreError() {
    return this.loadMoreStatus === MutationStatus.Error;
  }

  get isLoadingNewer() {
    return this.loadNewerStatus === MutationStatus.Loading;
  }

  get isLoadNewerError() {
    return this.loadNewerStatus === MutationStatus.Error;
  }

  get newestCursor(): string | number | null {
    if (this.items.length === 0 || !this._keyExtractor) return null;

    return this._keyExtractor(this.items[0]);
  }

  get oldestCursor(): string | number | null {
    if (this.items.length === 0 || !this._keyExtractor) return null;

    return this._keyExtractor(this.items[this.items.length - 1]);
  }

  get limit() {
    return this._limit;
  }

  setItems(items: TItem[], hasMore: boolean, hasNewer: boolean = false) {
    this.items = items;
    this.hasMore = hasMore;
    this.hasNewer = hasNewer;
    this.status = HolderStatus.Success;
    this.error = null;
    this.loadMoreStatus = MutationStatus.Idle;
    this.loadMoreError = null;
    this.loadNewerStatus = MutationStatus.Idle;
    this.loadNewerError = null;
  }

  appendItems(items: TItem[], hasMore: boolean) {
    if (items.length > 0) {
      const existingKeys = new Set(this.items.map(this._keyExtractor!));
      const newItems = items.filter(
        item => !existingKeys.has(this._keyExtractor!(item)),
      );

      this.items = [...this.items, ...newItems];
    }

    this.hasMore = hasMore;
    this.loadMoreStatus = MutationStatus.Success;
    this.loadMoreError = null;
  }

  prependItems(items: TItem[], hasNewer: boolean) {
    if (items.length > 0) {
      const existingKeys = new Set(this.items.map(this._keyExtractor!));
      const newItems = items.filter(
        item => !existingKeys.has(this._keyExtractor!(item)),
      );

      this.items = [...newItems, ...this.items];
    }

    this.hasNewer = hasNewer;
    this.loadNewerStatus = MutationStatus.Success;
    this.loadNewerError = null;
  }

  setLoadingOlder() {
    this.loadMoreStatus = MutationStatus.Loading;
    this.loadMoreError = null;
  }

  setLoadingNewer() {
    this.loadNewerStatus = MutationStatus.Loading;
    this.loadNewerError = null;
  }

  setOlderError(error: TError) {
    this.loadMoreStatus = MutationStatus.Error;
    this.loadMoreError = error;
  }

  setNewerError(error: TError) {
    this.loadNewerStatus = MutationStatus.Error;
    this.loadNewerError = error;
  }

  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.error = null;
    this.hasMore = false;
    this.hasNewer = false;
    this.loadMoreStatus = MutationStatus.Idle;
    this.loadMoreError = null;
    this.loadNewerStatus = MutationStatus.Idle;
    this.loadNewerError = null;
  }

  prependItem(item: TItem) {
    this.items = [item, ...this.items];
  }

  appendItem(item: TItem) {
    this.items = [...this.items, item];
  }

  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.filter(item => !fn(item));
  }
}
