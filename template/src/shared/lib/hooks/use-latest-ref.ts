import { RefObject, useRef } from "react";

/** Ref на последнее значение — из него читают стабильные колбэки. */
export const useLatestRef = <T>(value: T): RefObject<T> => {
  const ref = useRef(value);

  ref.current = value;

  return ref;
};
