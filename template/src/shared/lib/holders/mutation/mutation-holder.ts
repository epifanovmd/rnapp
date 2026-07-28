import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import {
  IApiResponse,
  IHolderError,
  isCancelError,
  isCancelResponse,
  MutationFn,
  MutationStatus,
  toHolderError,
} from "../holder.types";

export interface IMutationHolderOptions<TArgs, TData> {
  onMutate?: MutationFn<TArgs, TData>;
}

export interface IMutationHolderResult<
  TData,
  TError extends IHolderError = IHolderError,
> {
  data: TData | null;
  error: TError | null;
}

export class MutationHolder<
  TArgs = void,
  TData = void,
  TError extends IHolderError = IHolderError,
> {
  data: TData | null = null;
  status = MutationStatus.Idle;
  error: TError | null = null;

  private readonly _onMutate?: MutationFn<TArgs, TData>;

  constructor(options?: IMutationHolderOptions<TArgs, TData>) {
    makeObservable(this, {
      data: observable.ref,
      status: observable,
      error: observable.ref,

      isIdle: computed,
      isLoading: computed,
      isSuccess: computed,
      isError: computed,

      reset: action,
    });

    this._onMutate = options?.onMutate;
  }

  get isIdle() {
    return this.status === MutationStatus.Idle;
  }

  get isLoading() {
    return this.status === MutationStatus.Loading;
  }

  get isSuccess() {
    return this.status === MutationStatus.Success;
  }

  get isError() {
    return this.status === MutationStatus.Error;
  }

  reset() {
    this.data = null;
    this.status = MutationStatus.Idle;
    this.error = null;
  }

  async execute(
    ..._params: TArgs extends void
      ? [args?: never, fn?: MutationFn<TArgs, TData>]
      : [args: TArgs, fn?: MutationFn<TArgs, TData>]
  ): Promise<IMutationHolderResult<TData, TError>> {
    const args = _params[0] as TArgs;
    const fn = _params[1] ?? this._onMutate;

    if (!fn) {
      console.warn(
        "[MutationHolder] execute() called but no mutation function provided. " +
          "Pass it inline or set onMutate in options.",
      );

      return { data: null, error: null };
    }

    runInAction(() => {
      this.status = MutationStatus.Loading;
      this.error = null;
    });

    try {
      const res = await fn(args);

      if (isCancelResponse(res)) return { data: null, error: null };

      if (res.error) {
        runInAction(() => {
          this.status = MutationStatus.Error;
          this.error = res.error as unknown as TError;
        });

        return { data: null, error: res.error as unknown as TError };
      }

      runInAction(() => {
        this.data = (res.data ?? null) as TData | null;
        this.status = MutationStatus.Success;
        this.error = null;
      });

      return { data: (res.data ?? null) as TData | null, error: null };
    } catch (e) {
      if (isCancelError(e)) return { data: null, error: null };

      const err = toHolderError(e) as TError;

      runInAction(() => {
        this.status = MutationStatus.Error;
        this.error = err;
      });

      return { data: null, error: err };
    }
  }

  async run(
    fn: () => Promise<IApiResponse<TData>>,
  ): Promise<IMutationHolderResult<TData, TError>> {
    runInAction(() => {
      this.status = MutationStatus.Loading;
      this.error = null;
    });

    try {
      const res = await fn();

      if (isCancelResponse(res)) return { data: null, error: null };

      if (res.error) {
        runInAction(() => {
          this.status = MutationStatus.Error;
          this.error = res.error as unknown as TError;
        });

        return { data: null, error: res.error as unknown as TError };
      }

      runInAction(() => {
        this.data = (res.data ?? null) as TData | null;
        this.status = MutationStatus.Success;
      });

      return { data: (res.data ?? null) as TData | null, error: null };
    } catch (e) {
      if (isCancelError(e)) return { data: null, error: null };

      const err = toHolderError(e) as TError;

      runInAction(() => {
        this.status = MutationStatus.Error;
        this.error = err;
      });

      return { data: null, error: err };
    }
  }
}
