import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import { BaseHolder } from "./BaseHolder";
import {
  CancellablePromise,
  EntityFetchFn,
  HolderStatus,
  IApiResponse,
  IHolderError,
  isCancelError,
  isCancelResponse,
  toHolderError,
} from "./HolderTypes";

// ---------------------------------------------------------------------------

export interface IEntityHolderOptions<TData, TArgs = void> {
  /** Called automatically from `load()` / `refresh()`. */
  onFetch?: EntityFetchFn<TData, TArgs>;
  /** Initial data (status immediately becomes 'success'). */
  initialData?: TData;
}

export interface IEntityHolderResult<TData, TError extends IHolderError> {
  data: TData | null;
  error: TError | null;
}

// ---------------------------------------------------------------------------

/**
 * Holder for a **single entity** - detail pages, profile, current user, etc.
 *
 * Features:
 * - Full lifecycle: idle -> loading -> success / error
 * - Silent background refresh (data stays visible, `isRefreshing` = true)
 * - `fromApi()` method auto-manages loading state, error normalization, data storage
 * - `load()` / `refresh()` for stores passing `onFetch` in options
 * - Full MobX reactivity
 */
export class EntityHolder<
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseHolder<TError> {
  data: TData | null = null;

  private readonly _onFetch?: EntityFetchFn<TData, TArgs>;

  constructor(options?: IEntityHolderOptions<TData, TArgs>) {
    super();

    makeObservable(this, {
      data: observable.ref,

      isEmpty: computed,
      isFilled: computed,
      isReady: computed,

      setData: action,
      reset: action,
    });

    this._onFetch = options?.onFetch;

    if (options?.initialData !== undefined) {
      this.data = options.initialData;
      this.status = HolderStatus.Success;
    }
  }

  // --- Computed ------------------------------------------------------------

  /** Success, but server returned null / empty response. */
  get isEmpty() {
    return this.isSuccess && this.data === null;
  }

  /** Data is not null (regardless of current status). */
  get isFilled() {
    return this.data !== null;
  }

  /** At least one request has completed (success or error). Not idle and not loading. */
  get isReady() {
    return this.isSuccess || this.isError;
  }

  // --- Manual state setters ------------------------------------------------

  setData(data: TData) {
    this.data = data;
    this.status = HolderStatus.Success;
    this.error = null;
  }

  /** Clears data and resets status to idle. */
  reset() {
    this.data = null;
    this.status = HolderStatus.Idle;
    this.error = null;
  }

  // --- Async helpers -------------------------------------------------------

  /**
   * Wraps **any** API call returning `{ data?, error? }`.
   * Automatically manages loading state, error normalization, and data storage.
   *
   * Pass `{ refresh: true }` so old data stays visible during reload.
   */
  async fromApi<TApiError extends IHolderError = TError>(
    fn: () => Promise<IApiResponse<TData, TApiError>>,
    options?: { refresh?: boolean },
  ): Promise<IEntityHolderResult<TData, TApiError>> {
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
        this.setData(res.data);

        return { data: res.data, error: null };
      }

      // Server returned success without body (204 / empty data)
      runInAction(() => {
        this.data = null;
        this.status = HolderStatus.Success;
      });

      return { data: null, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e)) return { data: null, error: null };

      const err = toHolderError(e) as unknown as TApiError;

      this.setError(err as unknown as TError);

      return { data: null, error: err };
    }
  }

  /**
   * Calls `onFetch` passed in constructor options.
   * Performs a full load (spinner, clears old data on error).
   */
  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IEntityHolderResult<TData, TError>> {
    const args = _args[0] as TArgs;

    return this._runFetch(args, false);
  }

  /**
   * Calls `onFetch` silently - old data stays visible.
   * Used for pull-to-refresh or background updates.
   */
  async refresh(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IEntityHolderResult<TData, TError>> {
    const args = _args[0] as TArgs;

    return this._runFetch(args, true);
  }

  // --- Private -------------------------------------------------------------

  private async _runFetch(
    args: TArgs,
    isRefresh: boolean,
  ): Promise<IEntityHolderResult<TData, TError>> {
    if (!this._onFetch) {
      console.warn(
        "[EntityHolder] load/refresh called but no onFetch was provided in options.",
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

      if (res.data != null) {
        this.setData(res.data);

        return { data: res.data, error: null };
      }

      runInAction(() => {
        this.data = null;
        this.status = HolderStatus.Success;
      });

      return { data: null, error: null };
    } catch (e) {
      this._pendingFetch = null;

      if (isCancelError(e)) return { data: null, error: null };

      const err = toHolderError(e) as TError;

      this.setError(err);

      return { data: null, error: err };
    }
  }
}
