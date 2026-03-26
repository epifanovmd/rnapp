import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import { BaseListHolder } from "./BaseListHolder";
import {
  CancellablePromise,
  HolderStatus,
  IApiResponse,
  IHolderError,
  InfiniteFetchFn,
  IPagedResponse,
  isCancelError,
  isCancelResponse,
  MutationStatus,
  toHolderError,
} from "./HolderTypes";

// ---------------------------------------------------------------------------

export interface IInfiniteHolderOptions<TItem, TArgs = void> {
  /** Called on every load (initial, refresh, loadMore). */
  onFetch?: InfiniteFetchFn<TItem, TArgs>;
  /** Key extractor for CRUD helpers. */
  keyExtractor?: (item: TItem) => string | number;
  /** Items per page (default: 20). */
  pageSize?: number;
}

export interface IInfiniteHolderResult<TItem, TError extends IHolderError> {
  data: TItem[] | null;
  hasMore: boolean;
  error: TError | null;
}

// ---------------------------------------------------------------------------

/**
 * Holder for lists with **infinite scroll / "Load More"**.
 *
 * Unlike PagedHolder, all pages accumulate in `items`.
 * Separate `loadMoreStatus` tracks the "load more" spinner independently
 * from the main loading status.
 *
 * Features:
 * - `load(args?)` -> initial load, clears items
 * - `refresh(args?)` -> silent reload from offset 0, replaces items
 * - `loadMore()` -> appends next page (no-op if `!hasMore` or already loading)
 * - Built-in CRUD helpers over the full accumulated list
 * - `fromApi()` for manual control
 */
export class InfiniteHolder<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  /** Status of the **"load more"** action (independent of `status`). */
  loadMoreStatus = MutationStatus.Idle;

  loadMoreError: TError | null = null;

  /** Server indicated there are more items available. */
  hasMore: boolean = true;

  /** Last used arguments - for refresh / continuing loadMore. */
  lastArgs: TArgs | null = null;

  private _currentOffset: number = 0;
  private readonly _pageSize: number;
  private readonly _onFetch?: InfiniteFetchFn<TItem, TArgs>;

  constructor(options?: IInfiniteHolderOptions<TItem, TArgs>) {
    super(options?.keyExtractor);

    this._pageSize = options?.pageSize ?? 20;
    this._onFetch = options?.onFetch;

    makeObservable(this, {
      loadMoreStatus: observable,
      loadMoreError: observable.ref,
      hasMore: observable,
      lastArgs: observable.ref,

      isLoadingMore: computed,
      isLoadMoreError: computed,

      setItems: action,
      appendItems: action,
      prependItem: action,
      appendItem: action,
      removeItem: action,
      reset: action,
    });
  }

  // --- Computed ------------------------------------------------------------

  get isLoadingMore() {
    return this.loadMoreStatus === MutationStatus.Loading;
  }

  get isLoadMoreError() {
    return this.loadMoreStatus === MutationStatus.Error;
  }

  // --- State setters -------------------------------------------------------

  /**
   * Replaces all items (first load or refresh).
   * Resets offset to items.length.
   */
  setItems(items: TItem[], hasMore: boolean) {
    this.items = items;
    this.hasMore = hasMore;
    this._currentOffset = items.length;
    this.status = HolderStatus.Success;
    this.error = null;
    this.loadMoreStatus = MutationStatus.Idle;
    this.loadMoreError = null;
  }

  /** Appends next page items to the end of the list. */
  appendItems(items: TItem[], hasMore: boolean) {
    this.items = [...this.items, ...items];
    this.hasMore = hasMore;
    this._currentOffset = this.items.length;
    this.loadMoreStatus = MutationStatus.Success;
    this.loadMoreError = null;
  }

  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.loadMoreStatus = MutationStatus.Idle;
    this.error = null;
    this.loadMoreError = null;
    this.hasMore = true;
    this.lastArgs = null;
    this._currentOffset = 0;
  }

  // --- CRUD helpers --------------------------------------------------------

  prependItem(item: TItem) {
    this.items = [item, ...this.items];
    this._currentOffset += 1;
  }

  appendItem(item: TItem) {
    this.items = [...this.items, item];
    this._currentOffset += 1;
  }

  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.filter(item => !fn(item));
    this._currentOffset = Math.max(0, this._currentOffset - 1);
  }

  // --- Async helpers -------------------------------------------------------

  /** Initial load - clears existing items, shows skeleton. Resets offset to 0. */
  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IInfiniteHolderResult<TItem, TError>> {
    const args = _args[0] as TArgs;

    this.lastArgs = args ?? null;
    this._currentOffset = 0;

    return this._runFetch(args, "loading");
  }

  /** Silent reload from offset 0 - old items stay visible during request. */
  async refresh(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IInfiniteHolderResult<TItem, TError>> {
    const args = _args[0] as TArgs;

    this.lastArgs = args ?? null;
    this._currentOffset = 0;

    return this._runFetch(args, "refreshing");
  }

  /** Appends the next page. No-op if already loading or `!hasMore`. */
  async loadMore(): Promise<IInfiniteHolderResult<TItem, TError>> {
    if (!this.hasMore || this.isLoadingMore || this.isBusy) {
      return {
        data: this.items,
        hasMore: this.hasMore,
        error: null,
      };
    }

    return this._runFetch(this.lastArgs as TArgs, "loadMore");
  }

  /**
   * Manual API wrapper for initial load / refresh.
   */
  async fromApi<TResponse, TApiError extends IHolderError = TError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor: (
      response: TResponse,
      offset: number,
      limit: number,
    ) => { items: TItem[]; hasMore: boolean },
    options?: { append?: boolean; refresh?: boolean },
  ): Promise<IInfiniteHolderResult<TItem, TApiError>> {
    this._pendingFetch?.cancel?.();

    if (options?.append) {
      runInAction(() => {
        this.loadMoreStatus = MutationStatus.Loading;
        this.loadMoreError = null;
      });
    } else if (options?.refresh) {
      this.setRefreshing();
    } else {
      this.setLoading();
      this._currentOffset = 0;
    }

    const promise = fn();

    this._pendingFetch = promise as CancellablePromise;

    try {
      const res = await promise;

      this._pendingFetch = null;

      if (isCancelResponse(res))
        return { data: null, hasMore: this.hasMore, error: null };

      if (res.error) {
        if (options?.append) {
          runInAction(() => {
            this.loadMoreStatus = MutationStatus.Error;
            this.loadMoreError = res.error as unknown as TError;
          });
        } else {
          this.setError(res.error as unknown as TError);
        }

        return { data: null, hasMore: this.hasMore, error: res.error };
      }

      if (res.data != null) {
        const { items, hasMore } = extractor(
          res.data as TResponse,
          this._currentOffset,
          this._pageSize,
        );

        if (options?.append) {
          runInAction(() => {
            this.appendItems(items, hasMore);
          });
        } else {
          this.setItems(items, hasMore);
        }

        return { data: items, hasMore, error: null };
      }

      if (options?.append) {
        runInAction(() => {
          this.hasMore = false;
          this.loadMoreStatus = MutationStatus.Success;
        });
      } else {
        this.setItems([], false);
      }

      return { data: [], hasMore: false, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e))
        return { data: null, hasMore: this.hasMore, error: null };

      const err = toHolderError(e) as unknown as TApiError;

      if (options?.append) {
        runInAction(() => {
          this.loadMoreStatus = MutationStatus.Error;
          this.loadMoreError = err as unknown as TError;
        });
      } else {
        this.setError(err as unknown as TError);
      }

      return { data: null, hasMore: this.hasMore, error: err };
    }
  }

  // --- Private -------------------------------------------------------------

  private async _runFetch(
    args: TArgs,
    mode: "loading" | "refreshing" | "loadMore",
  ): Promise<IInfiniteHolderResult<TItem, TError>> {
    if (!this._onFetch) {
      console.warn(
        "[InfiniteHolder] load/refresh/loadMore called but no onFetch was provided in options.",
      );

      return { data: null, hasMore: false, error: null };
    }

    const isAppend = mode === "loadMore";

    this._pendingFetch?.cancel?.();

    if (isAppend) {
      runInAction(() => {
        this.loadMoreStatus = MutationStatus.Loading;
        this.loadMoreError = null;
      });
    } else if (mode === "refreshing") {
      this.setRefreshing();
    } else {
      this.setLoading();
    }

    const offset = isAppend ? this._currentOffset : 0;
    const promise = this._onFetch({ offset, limit: this._pageSize }, args);

    this._pendingFetch = promise as CancellablePromise;

    try {
      const res = await promise;

      this._pendingFetch = null;

      if (isCancelResponse(res))
        return { data: null, hasMore: this.hasMore, error: null };

      if (res.error) {
        if (isAppend) {
          runInAction(() => {
            this.loadMoreStatus = MutationStatus.Error;
            this.loadMoreError = res.error as unknown as TError;
          });
        } else {
          this.setError(res.error as unknown as TError);
        }

        return {
          data: null,
          hasMore: this.hasMore,
          error: res.error as unknown as TError,
        };
      }

      if (res.data != null) {
        const pagedRes = res.data as IPagedResponse<TItem>;
        const items = pagedRes.data ?? [];
        const hasMore = items.length >= this._pageSize;

        if (isAppend) {
          runInAction(() => {
            this.appendItems(items, hasMore);
          });
        } else {
          this.setItems(items, hasMore);
        }

        return { data: items, hasMore, error: null };
      }

      if (isAppend) {
        runInAction(() => {
          this.hasMore = false;
          this.loadMoreStatus = MutationStatus.Success;
        });
      } else {
        this.setItems([], false);
      }

      return { data: [], hasMore: false, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e))
        return { data: null, hasMore: this.hasMore, error: null };

      const err = toHolderError(e) as TError;

      if (isAppend) {
        runInAction(() => {
          this.loadMoreStatus = MutationStatus.Error;
          this.loadMoreError = err;
        });
      } else {
        this.setError(err);
      }

      return { data: null, hasMore: this.hasMore, error: err };
    }
  }
}
