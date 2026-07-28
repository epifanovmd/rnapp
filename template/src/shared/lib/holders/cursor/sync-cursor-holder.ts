import { action, makeObservable, observable, runInAction } from "mobx";

import {
  HolderStatus,
  IHolderError,
  MutationStatus,
  toHolderError,
} from "../holder.types";
import { CachedCursorHolder } from "./cached-cursor-holder";
import {
  ICacheAnchor,
  ICacheProvider,
  IFetchProvider,
  ISyncCursorHolderOptions,
} from "./cached-cursor-holder.types";

const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 30;

export class SyncCursorHolder<
  TItem,
  TError extends IHolderError = IHolderError,
> extends CachedCursorHolder<TItem, TError> {
  private _api: IFetchProvider<TItem>;
  private _initialLimit: number;
  private _pageLimit: number;
  private _fetchGeneration = 0;

  isFetching = false;
  pendingItems: TItem[] = [];

  constructor(
    api: IFetchProvider<TItem>,
    options: ISyncCursorHolderOptions<TItem>,
    cache?: ICacheProvider<TItem>,
  ) {
    super(options, cache);
    this._api = api;
    this._initialLimit = options.initialLimit ?? DEFAULT_INITIAL_LIMIT;
    this._pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;

    makeObservable(this, {
      isFetching: observable,
      pendingItems: observable,
      fetchInitial: action,
      loadOlder: action,
      loadNewer: action,
      navigateToItem: action,
      invalidate: action,
    });
  }

  bufferPendingItem(item: TItem): void {
    this.pendingItems.push(item);
  }

  invalidate(): void {
    this._fetchGeneration++;
    this.isFetching = false;
    this.pendingItems = [];
  }

  async fetchInitial(
    anchor: ICacheAnchor | null,
    currentKey: string | null,
    onDetach?: (isDetached: boolean) => void,
  ): Promise<void> {
    const key = this._boundKey;

    if (!key) return;

    const cached = this._readWindow(anchor, this._initialLimit);
    const hasCachedItems = cached != null && cached.items.length > 0;

    if (hasCachedItems) {
      const items = this._normalize(cached.items);

      this.setItems(items, cached.hasMore, cached.hasNewer);
    }

    if (hasCachedItems) {
      this.setRefreshing();
    } else {
      this.setLoading();
    }

    this.isFetching = true;
    this.pendingItems = [];
    const gen = ++this._fetchGeneration;

    try {
      const useAround = anchor && !anchor.wasAtBottom;
      const params = useAround
        ? { key, around: anchor!.id, limit: this._initialLimit }
        : { key, limit: this._initialLimit };

      const result = await this._api.fetch(params);

      runInAction(() => {
        this.isFetching = false;
      });

      if (gen !== this._fetchGeneration || currentKey !== key) {
        runInAction(() => {
          this.pendingItems = [];
        });

        return;
      }

      if (!result) {
        runInAction(() => {
          this.pendingItems = [];
        });

        return;
      }

      const serverIds = new Set(result.data.map(this._idExtractor));
      const fromBuffer = this.pendingItems.filter(
        m => !serverIds.has(this._idExtractor(m)),
      );
      const serverNorm = this._normalize([...fromBuffer, ...result.data]);

      if (hasCachedItems) {
        this._mergeInitial(serverNorm, result.hasMore, result.hasNewer);
      } else {
        this.setItems(serverNorm, result.hasMore, result.hasNewer);
      }

      onDetach?.(result.hasNewer);
      runInAction(() => {
        this.pendingItems = [];
      });
    } catch (e) {
      runInAction(() => {
        this.isFetching = false;
        this.pendingItems = [];

        if (hasCachedItems) {
          this.status = HolderStatus.Success;
        } else {
          this.setError(toHolderError(e));
        }
      });
    }
  }

  async loadOlder(): Promise<void> {
    const key = this._boundKey;

    if (!key || !this.hasMore || this.isLoadingMore || this.isFetching) {
      return;
    }

    const cursor =
      this.oldestCursor != null ? String(this.oldestCursor) : undefined;

    if (!cursor) {
      return;
    }

    const cachedRaw = this._readOlderWindow(cursor, this._pageLimit);
    const cached =
      cachedRaw && cachedRaw.length > 0 ? this._normalize(cachedRaw) : null;

    if (cached && cached.length > 0) {
      this.appendItems(cached, true);
    }

    this.setLoadingOlder();

    try {
      const result = await this._api.fetch({
        key,
        before: cursor,
        limit: this._pageLimit,
      });

      if (!result) {
        this.appendItems([], false);

        return;
      }

      const apiNorm = this._normalize(result.data);

      if (cached && cached.length > 0) {
        this._mergePage(cached, apiNorm, "older", result.hasMore);
      } else {
        this.appendItems(apiNorm, result.hasMore);
      }
    } catch (e) {
      this.setOlderError(toHolderError(e) as TError);
    }
  }

  async loadNewer(): Promise<void> {
    const key = this._boundKey;

    if (!key || !this.hasNewer || this.isLoadingNewer || this.isFetching) {
      return;
    }

    const cursor = this.newestCursor != null ? String(this.newestCursor) : null;

    if (!cursor) {
      return;
    }

    const cachedRaw = this._readNewerWindow(cursor, this._pageLimit);
    const cached =
      cachedRaw && cachedRaw.length > 0 ? this._normalize(cachedRaw) : null;

    if (cached && cached.length > 0) {
      this.prependItems(cached, true);
    }

    this.setLoadingNewer();

    try {
      const result = await this._api.fetch({
        key,
        after: cursor,
        limit: this._pageLimit,
      });

      if (!result || result.data.length === 0) {
        this.prependItems([], false);

        return;
      }

      const apiNorm = this._normalize(result.data);

      if (cached && cached.length > 0) {
        this._mergePage(cached, apiNorm, "newer", result.hasNewer);
      } else {
        this.prependItems(apiNorm, result.hasNewer);
      }
    } catch (e) {
      this.setNewerError(toHolderError(e) as TError);
    }
  }

  async navigateToItem(
    itemId: string,
    currentKey: string | null,
  ): Promise<boolean> {
    const key = this._boundKey;

    if (!key) return false;

    if (this.exists(itemId)) {
      return true;
    }

    const cached = this._readWindowAround(itemId, this._initialLimit);

    if (cached) {
      this.setItems(
        this._normalize(cached.items),
        cached.hasMore,
        cached.hasNewer,
      );

      return true;
    }

    const gen = ++this._fetchGeneration;

    try {
      const result = await this._api.fetch({
        key,
        around: itemId,
        limit: this._initialLimit,
      });

      if (!result || result.data.length === 0) return false;
      if (gen !== this._fetchGeneration || currentKey !== key) return false;
      if (!result.data.some(m => this._idExtractor(m) === itemId)) return false;

      this.setItems(
        this._normalize(result.data),
        result.hasMore,
        result.hasNewer,
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  private _mergeInitial(
    serverNorm: TItem[],
    hasMore: boolean,
    hasNewer: boolean,
  ): void {
    const serverById = new Map(serverNorm.map(m => [this._idExtractor(m), m]));
    const localIds = new Set(this.items.map(this._idExtractor));

    const updated = this.items.map(item => {
      const fresh = serverById.get(this._idExtractor(item));

      return fresh ?? item;
    });

    const newItems = serverNorm.filter(
      m => !localIds.has(this._idExtractor(m)),
    );

    const effectiveHasMore =
      this.items.length > serverNorm.length ? this.hasMore : hasMore;

    if (newItems.length > 0) {
      this.setItems(
        this._normalize([...newItems, ...updated]),
        effectiveHasMore,
        hasNewer,
      );
    } else {
      this.setItems(updated, effectiveHasMore, hasNewer);
    }
  }

  private _mergePage(
    cached: TItem[],
    api: TItem[],
    direction: "older" | "newer",
    apiFlag: boolean,
  ): void {
    const cachedIds = new Set(cached.map(this._idExtractor));
    const apiIds = new Set(api.map(this._idExtractor));

    const withoutOptimistic = this.items.filter(
      m => !cachedIds.has(this._idExtractor(m)),
    );
    const extraFromCache = cached.filter(
      m => !apiIds.has(this._idExtractor(m)),
    );
    const page = this._normalize([...api, ...extraFromCache]);

    runInAction(() => {
      if (direction === "older") {
        this.items = [...withoutOptimistic, ...page];
        this.hasMore = apiFlag;
        this.loadMoreStatus = MutationStatus.Success;
        this.loadMoreError = null;
      } else {
        this.items = [...page, ...withoutOptimistic];
        this.hasNewer = apiFlag;
        this.loadNewerStatus = MutationStatus.Success;
        this.loadNewerError = null;
      }
    });

    this._schedulePersist();
  }
}
