import { action, makeObservable } from "mobx";

import { BaseListHolder } from "./BaseListHolder";
import {
  CancellablePromise,
  CollectionFetchFn,
  HolderStatus,
  IApiResponse,
  IHolderError,
  isCancelError,
  isCancelResponse,
  toHolderError,
} from "./HolderTypes";

// ---------------------------------------------------------------------------

export interface ICollectionHolderOptions<TItem, TArgs = void> {
  /** Called automatically from `load()` / `refresh()`. */
  onFetch?: CollectionFetchFn<TItem, TArgs>;
  /** Key extractor for CRUD helpers (update/remove by id). */
  keyExtractor?: (item: TItem) => string | number;
}

export interface ICollectionHolderResult<TItem, TError extends IHolderError> {
  data: TItem[] | null;
  error: TError | null;
}

// ---------------------------------------------------------------------------

/**
 * Holder for a **flat list** of items without server-side pagination.
 * Suitable for small datasets, dropdowns, dictionaries, etc.
 *
 * Features:
 * - Full lifecycle + silent refresh
 * - Built-in CRUD helpers: `appendItem`, `prependItem`, `updateItem`, `removeItem`
 * - `fromApi()` method with extractor support (for nested `{ data: [...] }` responses)
 * - `load()` / `refresh()` for auto-loading via options
 */
export class CollectionHolder<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  private readonly _onFetch?: CollectionFetchFn<TItem, TArgs>;

  constructor(options?: ICollectionHolderOptions<TItem, TArgs>) {
    super(options?.keyExtractor);

    makeObservable(this, {
      setItems: action,
      reset: action,
    });

    this._onFetch = options?.onFetch;
  }

  // --- State setters -------------------------------------------------------

  setItems(items: TItem[]) {
    this.items = items;
    this.status = HolderStatus.Success;
    this.error = null;
  }

  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.error = null;
  }

  // --- CRUD helpers --------------------------------------------------------

  /** Adds item to the beginning of the list. */
  prependItem(item: TItem) {
    this.items = [item, ...this.items];
  }

  /** Adds item to the end of the list. */
  appendItem(item: TItem) {
    this.items = [...this.items, item];
  }

  /** Removes the first item matching `predicate` or key. */
  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.filter(item => !fn(item));
  }

  // --- Async helpers -------------------------------------------------------

  /**
   * Wraps an API call, automatically managing loading state.
   *
   * Supports both flat `TItem[]` responses and nested ones via
   * an optional `extractor`, e.g. `res => res.data ?? []`.
   */
  async fromApi<TResponse = TItem[], TApiError extends IHolderError = TError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor?: (response: TResponse) => TItem[],
    options?: { refresh?: boolean },
  ): Promise<ICollectionHolderResult<TItem, TApiError>> {
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

      if (isCancelResponse(res)) return { data: null, error: null };

      if (res.error) {
        this.setError(res.error as unknown as TError);

        return { data: null, error: res.error };
      }

      if (res.data != null) {
        const items = extractor
          ? extractor(res.data as TResponse)
          : (res.data as unknown as TItem[]);

        this.setItems(items);

        return { data: items, error: null };
      }

      this.setItems([]);

      return { data: [], error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e)) return { data: null, error: null };

      const err = toHolderError(e) as unknown as TApiError;

      this.setError(err as unknown as TError);

      return { data: null, error: err };
    }
  }

  /** Calls `onFetch` from constructor options (full load). */
  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<ICollectionHolderResult<TItem, TError>> {
    return this._runFetch(_args[0] as TArgs, false);
  }

  /** Calls `onFetch` silently - old items stay visible. */
  async refresh(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<ICollectionHolderResult<TItem, TError>> {
    return this._runFetch(_args[0] as TArgs, true);
  }

  // --- Private -------------------------------------------------------------

  private async _runFetch(
    args: TArgs,
    isRefresh: boolean,
  ): Promise<ICollectionHolderResult<TItem, TError>> {
    if (!this._onFetch) {
      console.warn(
        "[CollectionHolder] load/refresh called but no onFetch was provided in options.",
      );

      return { data: null, error: null };
    }

    this._pendingFetch?.cancel?.();

    if (isRefresh) {
      this.setRefreshing();
    } else {
      this.setLoading();
    }

    const promise = this._onFetch(args);

    this._pendingFetch = promise as CancellablePromise;

    try {
      const res = await promise;

      this._pendingFetch = null;

      if (isCancelResponse(res)) return { data: null, error: null };

      if (res.error) {
        this.setError(res.error as unknown as TError);

        return { data: null, error: res.error as unknown as TError };
      }

      const items = (res.data ?? []) as TItem[];

      this.setItems(items);

      return { data: items, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e)) return { data: null, error: null };

      const err = toHolderError(e) as TError;

      this.setError(err);

      return { data: null, error: err };
    }
  }
}
