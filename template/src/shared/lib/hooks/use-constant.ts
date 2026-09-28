import { useRef } from "react";

/** Значение, создаваемое один раз на всё время жизни компонента. */
export const useConstant = <T>(create: () => T): T => {
  const ref = useRef<T | null>(null);

  ref.current ??= create();

  return ref.current;
};
