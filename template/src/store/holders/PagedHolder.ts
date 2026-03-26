import { action, computed, makeObservable, observable } from "mobx";

import { BaseListHolder } from "./BaseListHolder";
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
} from "./HolderTypes";

// ---------------------------------------------------------------------------

export interface IPagedHolderPagination {
  /** Current page, 1-based. */
  page: number;
  pageSize: number;
  /** Total items across all pages (from server). */
  totalCount: number;
}

export interface IPagedHolderOptions<TItem, TArgs = void> {
  /** Called automatically from `load()` / `goToPage()` / `reload()`. */
  onFetch?: PagedFetchFn<TItem, TArgs>;
  /** Key extractor for CRUD helpers (updateItem / removeItem). */
  keyExtractor?: (item: TItem) => string | number;
  /** Default page size (default: 20). */
  pageSize?: number;
}

export interface IPagedHolderResult<TItem, TError extends IHolderError> {
  data: TItem[] | null;
  totalCount: number;
  error: TError | null;
}

// ---------------------------------------------------------------------------

/**
 * Holder for **server-side pagination**.
 *
 * Manages current page, page size, total count, and navigation.
 * Each page change triggers a new API request.
 *
 * Features:
 * - Full lifecycle + silent refresh
 * - `load(args?)` -> loads page 1
 * - `goToPage(n)` -> navigates to page n
 * - `setPageSize(n)` -> changes page size and reloads from page 1
 * - `reload()` -> re-fetches current page with same arguments
 * - Built-in CRUD helpers for optimistic updates on current page
 * - `fromApi()` for manual control
 */
export class PagedHolder<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  pagination: IPagedHolderPagination;

  /** Arguments from the last successful load - used in reload(). */
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

  // --- Computed ------------------------------------------------------------

  /** Total number of pages based on server totalCount. */
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

  /** Offset to send to server for the current page. */
  get offset() {
    const { page, pageSize } = this.pagination;

    return (page - 1) * pageSize;
  }

  // --- State setters -------------------------------------------------------

  /** Moves to a page without making a request (use with manual setItems). */
  setPage(page: number) {
    this.pagination = { ...this.pagination, page: Math.max(1, page) };
  }

  /** Changes page size and resets to page 1 (does NOT make a request). */
  setPageSize(pageSize: number) {
    this.pagination = { ...this.pagination, pageSize, page: 1 };
  }

  /** Batch-updates pagination fields (does NOT make a request). */
  setPagination(update: Partial<IPagedHolderPagination>) {
    this.pagination = { ...this.pagination, ...update };
  }

  /**
   * Sets current page items and total count from server.
   * Called after a successful API response.
   */
  setItems(items: TItem[], totalCount: number) {
    this.items = items;
    this.pagination = { ...this.pagination, totalCount };
    this.status = HolderStatus.Success;
    this.error = null;
  }

  /** Resets items, pagination (except pageSize), and status to idle. */
  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.error = null;
    this.lastArgs = null;
    this.pagination = { ...this.pagination, page: 1, totalCount: 0 };
  }

  // --- CRUD helpers (optimistic, current page only) ------------------------

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

  // --- Async helpers -------------------------------------------------------

  /**
   * Wraps a **manual** API call returning a paged response.
   * Manages loading state, error normalization, and data storage.
   */
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

  /**
   * Loads page 1 with new arguments.
   * Resets current page to 1 before making the request.
   */
  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IPagedHolderResult<TItem, TError>> {
    const args = _args[0] as TArgs;

    this.lastArgs = args ?? null;
    this.pagination = { ...this.pagination, page: 1 };

    return this._runFetch(args, false);
  }

  /**
   * Re-fetches **current page** with the same arguments used last time.
   */
  async reload(options?: {
    refresh?: boolean;
  }): Promise<IPagedHolderResult<TItem, TError>> {
    return this._runFetch(this.lastArgs as TArgs, options?.refresh ?? false);
  }

  /** Navigates to the specified page and loads its data. */
  async goToPage(
    page: number,
    options?: { refresh?: boolean },
  ): Promise<IPagedHolderResult<TItem, TError>> {
    this.pagination = {
      ...this.pagination,
      page: Math.max(1, Math.min(page, this.pageCount)),
    };

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

  // --- Private -------------------------------------------------------------

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
