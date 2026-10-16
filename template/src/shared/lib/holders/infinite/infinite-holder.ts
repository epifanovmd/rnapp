import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import { BaseListHolder } from "../base/base-list-holder";
import {
  HolderStatus,
  IApiResponse,
  IHolderError,
  InfiniteFetchFn,
  IPagedResponse,
  MutationStatus,
} from "../holder.types";

export interface IInfiniteHolderOptions<TItem, TArgs = void> {
  onFetch?: InfiniteFetchFn<TItem, TArgs>;
  keyExtractor?: (item: TItem) => string | number;
  pageSize?: number;
}

export interface IInfiniteHolderResult<TItem, TError extends IHolderError> {
  data: TItem[] | null;
  hasMore: boolean;
  error: TError | null;
}

export class InfiniteHolder<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  loadMoreStatus = MutationStatus.Idle;

  loadMoreError: TError | null = null;

  hasMore: boolean = false;

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

  get isLoadingMore() {
    return this.loadMoreStatus === MutationStatus.Loading;
  }

  get isLoadMoreError() {
    return this.loadMoreStatus === MutationStatus.Error;
  }

  setItems(items: TItem[], hasMore: boolean) {
    this.items = items;
    this.hasMore = hasMore;
    this._currentOffset = items.length;
    this.status = HolderStatus.Success;
    this.error = null;
    this.loadMoreStatus = MutationStatus.Idle;
    this.loadMoreError = null;
  }

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
    this.hasMore = false;
    this.lastArgs = null;
    this._currentOffset = 0;
  }

  prependItem(item: TItem) {
    this.items = [item, ...this.items];
    this._currentOffset++;
  }

  appendItem(item: TItem) {
    this.items = [...this.items, item];
    this._currentOffset++;
  }

  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    const items = this.items.filter(item => !fn(item));

    this._currentOffset = Math.max(
      0,
      this._currentOffset - (this.items.length - items.length),
    );
    this.items = items;
  }

  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IInfiniteHolderResult<TItem, TError>> {
    const args = _args[0] as TArgs;

    runInAction(() => {
      this.lastArgs = args ?? null;
    });
    this._currentOffset = 0;

    return this._runFetch(args, "loading");
  }

  async refresh(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IInfiniteHolderResult<TItem, TError>> {
    const args = _args[0] as TArgs;

    runInAction(() => {
      this.lastArgs = args ?? null;
    });
    this._currentOffset = 0;

    return this._runFetch(args, "refreshing");
  }

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

  async fromApi<TResponse, TApiError extends IHolderError = TError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor: (
      response: TResponse,
      offset: number,
      limit: number,
    ) => { items: TItem[]; hasMore: boolean },
    options?: { append?: boolean; refresh?: boolean },
  ): Promise<IInfiniteHolderResult<TItem, TApiError>> {
    const mode = options?.append
      ? "loadMore"
      : options?.refresh
        ? "refreshing"
        : "loading";

    return this._fetch(fn, extractor, mode);
  }

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

    const onFetch = this._onFetch;
    const offset = mode === "loadMore" ? this._currentOffset : 0;

    return this._fetch(
      () =>
        onFetch({ offset, limit: this._pageSize }, args) as Promise<
          IApiResponse<IPagedResponse<TItem>, TError>
        >,
      pagedRes => {
        const items = pagedRes.data ?? [];

        return { items, hasMore: items.length >= this._pageSize };
      },
      mode,
    );
  }

  private _fetch<TResponse, TApiError extends IHolderError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor: (
      response: TResponse,
      offset: number,
      limit: number,
    ) => { items: TItem[]; hasMore: boolean },
    mode: "loading" | "refreshing" | "loadMore",
  ): Promise<IInfiniteHolderResult<TItem, TApiError>> {
    const isAppend = mode === "loadMore";

    return this._request<
      TResponse,
      TApiError,
      IInfiniteHolderResult<TItem, TApiError>
    >(fn, {
      onStart: () =>
        runInAction(() => {
          if (isAppend) {
            this.loadMoreStatus = MutationStatus.Loading;
            this.loadMoreError = null;

            return;
          }

          if (this.loadMoreStatus === MutationStatus.Loading) {
            this.loadMoreStatus = MutationStatus.Idle;
          }

          if (mode === "refreshing") {
            this.setRefreshing();
          } else {
            this.setLoading();
            this._currentOffset = 0;
          }
        }),
      onSuccess: data => {
        if (data == null) {
          runInAction(() => {
            if (isAppend) {
              this.hasMore = false;
              this.loadMoreStatus = MutationStatus.Success;
            } else {
              this.setItems([], false);
            }
          });

          return { data: [], hasMore: false, error: null };
        }

        const { items, hasMore } = extractor(
          data,
          this._currentOffset,
          this._pageSize,
        );

        runInAction(() =>
          isAppend
            ? this.appendItems(items, hasMore)
            : this.setItems(items, hasMore),
        );

        return { data: items, hasMore, error: null };
      },
      onError: error => {
        runInAction(() => {
          if (isAppend) {
            this.loadMoreStatus = MutationStatus.Error;
            this.loadMoreError = error as unknown as TError;
          } else {
            this.setError(error as unknown as TError);
          }
        });

        return { data: null, hasMore: this.hasMore, error };
      },
      onCancel: () => {
        if (isAppend) {
          runInAction(() => {
            this.loadMoreStatus = MutationStatus.Idle;
          });
        } else {
          this._restoreStatus(this.items.length > 0);
        }
      },
      skipped: () => ({ data: null, hasMore: this.hasMore, error: null }),
    });
  }
}
