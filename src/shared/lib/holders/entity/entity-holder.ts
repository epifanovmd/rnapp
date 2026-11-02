import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import { BaseHolder } from "../base/base-holder";
import {
  EntityFetchFn,
  HolderStatus,
  IApiResponse,
  IHolderError,
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
    return this._fetch(fn, options?.refresh ?? false);
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

    const onFetch = this._onFetch;

    return this._fetch(
      () => onFetch(args) as Promise<IApiResponse<TData, TError>>,
      isRefresh,
    );
  }

  private _fetch<TApiError extends IHolderError>(
    fn: () => Promise<IApiResponse<TData, TApiError>>,
    isRefresh: boolean,
  ): Promise<IEntityHolderResult<TData, TApiError>> {
    return this._request<
      TData,
      TApiError,
      IEntityHolderResult<TData, TApiError>
    >(fn, {
      onStart: () => (isRefresh ? this.setRefreshing() : this.setLoading()),
      onSuccess: data => {
        if (data != null) {
          this.setData(data);

          return { data, error: null };
        }

        runInAction(() => {
          this.data = null;
          this.status = HolderStatus.Success;
        });

        return { data: null, error: null };
      },
      onError: error => {
        this.setError(error as unknown as TError);

        return { data: null, error };
      },
      onCancel: () => this._restoreStatus(this.data !== null),
      skipped: () => ({ data: null, error: null }),
    });
  }
}
