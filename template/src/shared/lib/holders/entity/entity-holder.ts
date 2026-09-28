import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import { BaseHolder } from "../base/base-holder";
import {
  CancellablePromise,
  EntityFetchFn,
  HolderStatus,
  IApiResponse,
  IHolderError,
  isCancelError,
  isCancelResponse,
  toHolderError,
} from "../holder.types";

export interface IEntityHolderOptions<TData, TArgs = void> {
  onFetch?: EntityFetchFn<TData, TArgs>;
  initialData?: TData;
}

export interface IEntityHolderResult<TData, TError extends IHolderError> {
  data: TData | null;
  error: TError | null;
}

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

  get isEmpty() {
    return this.isSuccess && this.data === null;
  }

  get isFilled() {
    return this.data !== null;
  }

  get isReady() {
    return this.isSuccess || this.isError;
  }

  setData(data: TData) {
    this.data = data;
    this.status = HolderStatus.Success;
    this.error = null;
  }

  reset() {
    this.data = null;
    this.status = HolderStatus.Idle;
    this.error = null;
  }

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

  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IEntityHolderResult<TData, TError>> {
    const args = _args[0] as TArgs;

    return this._runFetch(args, false);
  }

  async refresh(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<IEntityHolderResult<TData, TError>> {
    const args = _args[0] as TArgs;

    return this._runFetch(args, true);
  }

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
