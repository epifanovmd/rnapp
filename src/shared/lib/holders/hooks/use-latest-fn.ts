import { useLayoutEffect, useRef, useState } from "react";

type AnyFn = (...args: any[]) => any;

/**
 * Стабильная обёртка над функцией из опций хука: холдер создаётся один раз,
 * а вызывает функцию последнего рендера (видит актуальные пропсы и state).
 * Без функции на первом рендере — `undefined`, как если бы её не передали.
 */
export const useLatestFn = <TFn extends AnyFn>(
  fn: TFn | undefined,
): TFn | undefined => {
  const ref = useRef(fn);

  useLayoutEffect(() => {
    if (fn) ref.current = fn;
  });

  const [stable] = useState(() =>
    fn ? (((...args) => ref.current!(...args)) as TFn) : undefined,
  );

  return stable;
};
