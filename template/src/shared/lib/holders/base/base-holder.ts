import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";

import {
  CancellablePromise,
  HolderStatus,
  IApiResponse,
  IHolderError,
  isCancelError,
  isCancelResponse,
  toHolderError,
} from "../holder.types";

/** Обработчики жизненного цикла запроса для `BaseHolder._request`. */
export interface IHolderRequestHandlers<TResponse, TApiError, TResult> {
  /** Перевод холдера в состояние загрузки — до вызова запроса. */
  onStart: () => void;
  /** Ответ без ошибки последнего запроса. */
  onSuccess: (data: TResponse | null | undefined) => TResult;
  /** Ошибка последнего запроса: из ответа или брошенная. */
  onError: (error: TApiError) => TResult;
  /** Отмена последнего запроса — восстановление статуса. */
  onCancel: () => void;
  /** Результат для отменённого или устаревшего запроса. */
  skipped: () => TResult;
}

export abstract class BaseHolder<TError extends IHolderError = IHolderError> {
  status = HolderStatus.Idle;
  error: TError | null = null;

  protected _pendingFetch: CancellablePromise | null = null;

  /** Номер последнего запущенного запроса: применяется только его результат. */
  protected _requestId = 0;

  constructor() {
    makeObservable(this, {
      status: observable,
      error: observable.ref,

      isIdle: computed,
      isLoading: computed,
      isRefreshing: computed,
      isBusy: computed,
      isSuccess: computed,
      isError: computed,

      setLoading: action,
      setRefreshing: action,
      setError: action,
    });
  }

  get isIdle() {
    return this.status === HolderStatus.Idle;
  }

  get isLoading() {
    return this.status === HolderStatus.Loading;
  }

  get isRefreshing() {
    return this.status === HolderStatus.Refreshing;
  }

  get isBusy() {
    return (
      this.status === HolderStatus.Loading ||
      this.status === HolderStatus.Refreshing
    );
  }

  get isSuccess() {
    return this.status === HolderStatus.Success;
  }

  get isError() {
    return this.status === HolderStatus.Error;
  }

  setLoading() {
    this.status = HolderStatus.Loading;
    this.error = null;
  }

  setRefreshing() {
    this.status = HolderStatus.Refreshing;
    this.error = null;
  }

  setError(error: TError | IHolderError | string) {
    this.status = HolderStatus.Error;
    this.error =
      typeof error === "string"
        ? ({ message: error } as TError)
        : (error as TError);
  }

  /** Статус после отмены последнего запроса: `Success` при наличии данных, иначе `Idle`. */
  protected _restoreStatus(hasData: boolean) {
    runInAction(() => {
      this.status = hasData ? HolderStatus.Success : HolderStatus.Idle;
    });
  }

  /**
   * Общий конвейер загрузки: отменяет предыдущий запрос и применяет результат,
   * только если запрос остался последним (устаревший ответ не перезаписывает свежий).
   */
  protected async _request<TResponse, TApiError extends IHolderError, TResult>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    handlers: IHolderRequestHandlers<TResponse, TApiError, TResult>,
  ): Promise<TResult> {
    this._pendingFetch?.cancel?.();
    this._pendingFetch = null;

    const id = ++this._requestId;
    const isLatest = () => id === this._requestId;

    handlers.onStart();

    let promise: CancellablePromise | null = null;

    try {
      promise = fn();
      this._pendingFetch = promise;

      const res = (await promise) as IApiResponse<TResponse, TApiError>;

      if (!isLatest()) return handlers.skipped();

      if (isCancelResponse(res)) {
        handlers.onCancel();

        return handlers.skipped();
      }

      if (res.error) return handlers.onError(res.error);

      return handlers.onSuccess(res.data);
    } catch (e) {
      if (!isLatest()) return handlers.skipped();

      if (isCancelError(e)) {
        handlers.onCancel();

        return handlers.skipped();
      }

      return handlers.onError(toHolderError(e) as TApiError);
    } finally {
      if (this._pendingFetch === promise) this._pendingFetch = null;
    }
  }
}
