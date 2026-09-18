export interface CancelablePromise<T> extends Promise<T> {
  cancel(reason?: string): void;
}

/** Навешивает `cancel` на промис, не создавая обёртку. */
export const toCancelable = <T>(
  promise: Promise<T>,
  cancel: (reason?: string) => void,
): CancelablePromise<T> => Object.assign(promise, { cancel });

/** `then`, сохраняющий отмену исходного промиса: обычный `.then()` её теряет. */
export const mapCancelable = <T, U>(
  source: CancelablePromise<T>,
  map: (value: T) => U | PromiseLike<U>,
): CancelablePromise<U> =>
  toCancelable(source.then(map), reason => source.cancel(reason));

export const isCancelablePromise = <T = unknown>(
  value: unknown,
): value is CancelablePromise<T> =>
  value instanceof Promise &&
  typeof (value as Partial<CancelablePromise<T>>).cancel === "function";
