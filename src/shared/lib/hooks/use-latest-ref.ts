import { RefObject, useCallback, useRef } from "react";

/** Ref на последнее значение — из него читают стабильные колбэки. */
export const useLatestRef = <T>(value: T): RefObject<T> => {
  const ref = useRef(value);

  ref.current = value;

  return ref;
};

/** Стабильная обёртка над функцией: identity не меняется, тело — свежее. */
export const useEvent = <Args extends unknown[], Result>(
  handler: (...args: Args) => Result,
): ((...args: Args) => Result) => {
  const ref = useLatestRef(handler);

  return useCallback((...args: Args) => ref.current(...args), [ref]);
};
