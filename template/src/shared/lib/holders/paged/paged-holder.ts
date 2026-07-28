import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import { BaseListHolder } from "../base/base-list-holder";
import {
  CancellablePromise,
  HolderStatus,
  IApiResponse,
  IHolderError,
  IPagedResponse,
  isCancelError,
  isCancelResponse,
  PagedFetchFn,
  toHolderError,
} from "../holder.types";

export interface IPagedHolderPagination {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface IPagedHolderOptions<TItem, TArgs = void> {
  onFetch?: PagedFetchFn<TItem, TArgs>;
  keyExtractor?: (item: TItem) => string | number;
  pageSize?: number;
}

export interface IPagedHolderResult<TItem, TError extends IHolderError> {
  data: TItem[] | null;
  totalCount: number;
  error: TError | null;
}

export class PagedHolder<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  pagination: IPagedHolderPagination;

  lastArgs: TArgs | null = null;

  private readonly _onFetch?: PagedFetchFn<TItem, TArgs>;

  constructor(options?: IPagedHolderOptions<TItem, TArgs>) {
    super(options?.keyExtractor);

    this.pagination = {
      page: 1,
      pageSize: options?.pageSize ?? 20,
      totalCount: 0,
    };

    makeObservable(this, {
      pagination: observable,
      lastArgs: observable.ref,

      pageCount: computed,
      hasNextPage: computed,
      hasPrevPage: computed,
      offset: computed,

      setPage: action,
      setPageSize: action,
      setPagination: action,
      setItems: action,
      prependItem: action,
      appendItem: action,
      removeItem: action,
      reset: action,
    });

    this._onFetch = options?.onFetch;
  }

  get pageCount() {
    const { pageSize, totalCount } = this.pagination;

    return pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  }

  get hasNextPage() {
    return this.pagination.page < this.pageCount;
  }

  get hasPrevPage() {
    return this.pagination.page > 1;
  }

  get offset() {
    const { page, pageSize } = this.pagination;

    return (page - 1) * pageSize;
  }

  setPage(page: number) {
    this.pagination = { ...this.pagination, page: Math.max(1, page) };
  }

  setPageSize(pageSize: number) {
    this.pagination = { ...this.pagination, pageSize, page: 1 };
  }

  setPagination(update: Partial<IPagedHolderPagination>) {
    this.pagination = { ...this.pagination, ...update };
  }

  setItems(items: TItem[], totalCount: number) {
    this.items = items;
    this.pagination = { ...this.pagination, totalCount };
    this.status = HolderStatus.Success;
    this.error = null;
  }

  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.error = null;
    this.lastArgs = null;
    this.pagination = { ...this.pagination, page: 1, totalCount: 0 };
  }

  prependItem(item: TItem) {
    this.items = [item, ...this.items];
    this.pagination = {
      ...this.pagination,
      totalCount: this.pagination.totalCount + 1,
    };
  }

  appendItem(item: TItem) {
    this.items = [...this.items, item];
    this.pagination = {
      ...this.pagination,
      totalCount: this.pagination.totalCount + 1,
    };
  }

  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.filter(item => !fn(item));
    this.pagination = {
      ...this.pagination,
      totalCount: Math.max(0, this.pagination.totalCount - 1),
    };
  }

  async fromApi<TResponse, TApiError extends IHolderError = TError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor: (response: TResponse) => { items: TItem[]; totalCount: number },
    options?: { refresh?: boolean },
  ): Promise<IPagedHolderResult<TItem, TApiError>> {
    this._pendingFetch?.cancel?.();

    if (options?.refresh) {
      this.setRefreshing();
    } else {
      this.setLoading();
    }

    const promise = fn();

    this._pendingFetch = promise as CancellablePromise;

    try {
      const res = await promise;

      this._pendingFetch = null;

      if (isCancelResponse(res))
        return { data: null, totalCount: 0, error: null };

      if (res.error) {
        this.setError(res.error as unknown as TError);

        return { data: null, totalCount: 0, error: res.error };
      }

      if (res.data != null) {
        const { items, totalCount } = extractor(res.data as TResponse);

        this.setItems(items, totalCount);

        return { data: items, totalCount, error: null };
      }

      this.setItems([], 0);

      return { data: [], totalCount: 0, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e)) return { data: null, totalCount: 0, error: null };

      const err = toHolderError(e) as unknown as TApiError;

      this.setError(err as unknown as TError);

      return { data: null, totalCount: 0, error: err };
    }
  }

  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IPagedHolderResult<TItem, TError>> {
    const args = _args[0] as TArgs;

    runInAction(() => {
      this.lastArgs = args ?? null;
      this.pagination = { ...this.pagination, page: 1 };
    });

    return this._runFetch(args, false);
  }

  async reload(options?: {
    refresh?: boolean;
  }): Promise<IPagedHolderResult<TItem, TError>> {
    return this._runFetch(this.lastArgs as TArgs, options?.refresh ?? false);
  }

  async goToPage(
    page: number,
    options?: { refresh?: boolean },
  ): Promise<IPagedHolderResult<TItem, TError>> {
    runInAction(() => {
      this.pagination = {
        ...this.pagination,
        page: Math.max(1, Math.min(page, this.pageCount)),
      };
    });

    return this._runFetch(this.lastArgs as TArgs, options?.refresh ?? false);
  }

  async nextPage(): Promise<IPagedHolderResult<TItem, TError>> {
    if (!this.hasNextPage)
      return {
        data: this.items,
        totalCount: this.pagination.totalCount,
        error: null,
      };

    return this.goToPage(this.pagination.page + 1);
  }

  async prevPage(): Promise<IPagedHolderResult<TItem, TError>> {
    if (!this.hasPrevPage)
      return {
        data: this.items,
        totalCount: this.pagination.totalCount,
        error: null,
      };

    return this.goToPage(this.pagination.page - 1);
  }

  private async _runFetch(
    args: TArgs,
    isRefresh: boolean,
  ): Promise<IPagedHolderResult<TItem, TError>> {
    if (!this._onFetch) {
      console.warn(
        "[PagedHolder] load/reload/goToPage called but no onFetch was provided in options.",
      );

      return { data: null, totalCount: 0, error: null };
    }

    this._pendingFetch?.cancel?.();

    if (isRefresh) {
      this.setRefreshing();
    } else {
      this.setLoading();
    }

    const { page, pageSize } = this.pagination;
    const offset = (page - 1) * pageSize;
    const promise = this._onFetch({ offset, limit: pageSize }, args);

    this._pendingFetch = promise as CancellablePromise;

    try {
      const res = await promise;

      this._pendingFetch = null;

      if (isCancelResponse(res))
        return { data: null, totalCount: 0, error: null };

      if (res.error) {
        this.setError(res.error as unknown as TError);

        return {
          data: null,
          totalCount: 0,
          error: res.error as unknown as TError,
        };
      }

      if (res.data != null) {
        const pagedRes = res.data as IPagedResponse<TItem>;
        const items = pagedRes.data ?? [];
        const totalCount =
          pagedRes.totalCount ?? pagedRes.count ?? items.length;

        this.setItems(items, totalCount);

        return { data: items, totalCount, error: null };
      }

      this.setItems([], 0);

      return { data: [], totalCount: 0, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e)) return { data: null, totalCount: 0, error: null };

      const err = toHolderError(e) as TError;

      this.setError(err);

      return { data: null, totalCount: 0, error: err };
    }
  }
}
