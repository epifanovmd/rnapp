import { useRef } from "react";

/** Возвращает ту же ссылку на массив, если элементы не изменились. Полезно для мемоизации. */
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
