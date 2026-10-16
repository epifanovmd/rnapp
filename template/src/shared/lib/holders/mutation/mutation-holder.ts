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
  /** Мутация отменена: ни успех, ни ошибка. */
  isCanceled?: boolean;
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

  /** Номер последнего вызова: состояние меняет только его результат. */
  private _requestId = 0;

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

    return this._mutate(() => fn(args));
  }

  async run(
    fn: () => Promise<IApiResponse<TData>>,
  ): Promise<IMutationHolderResult<TData, TError>> {
    return this._mutate(fn);
  }

  private async _mutate(
    fn: () => Promise<IApiResponse<TData>>,
  ): Promise<IMutationHolderResult<TData, TError>> {
    const id = ++this._requestId;
    const isLatest = () => id === this._requestId;
    const canceled = () => {
      if (isLatest()) {
        runInAction(() => {
          this.status =
            this.data !== null ? MutationStatus.Success : MutationStatus.Idle;
        });
      }

      return { data: null, error: null, isCanceled: true };
    };
    const failed = (error: TError) => {
      if (isLatest()) {
        runInAction(() => {
          this.status = MutationStatus.Error;
          this.error = error;
        });
      }

      return { data: null, error };
    };

    runInAction(() => {
      this.status = MutationStatus.Loading;
      this.error = null;
    });

    try {
      const res = await fn();

      if (isCancelResponse(res)) return canceled();

      if (res.error) return failed(res.error as unknown as TError);

      const data = (res.data ?? null) as TData | null;

      if (isLatest()) {
        runInAction(() => {
          this.data = data;
          this.status = MutationStatus.Success;
          this.error = null;
        });
      }

      return { data, error: null };
    } catch (e) {
      if (isCancelError(e)) return canceled();

      return failed(toHolderError(e) as TError);
    }
  }
}
