import { useRef } from "react";

export const useStableArray = <T extends readonly unknown[]>(value: T): T => {
  const ref = useRef(value);

  if (
    ref.current !== value &&
    (ref.current.length !== value.length ||
      ref.current.some((item, index) => item !== value[index]))
  ) {
    ref.current = value;
  }

  return ref.current;
};
