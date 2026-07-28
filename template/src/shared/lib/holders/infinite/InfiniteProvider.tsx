import { type ReactNode } from "react";

import { InfiniteCtx } from "./use-infinite-context";
import {
  useInfinite,
  type UseInfiniteOptions,
  type UseInfiniteResult,
} from "./use-infinite-holder";

export const InfiniteProvider = <TItem, TArgs = void>({
  children,
  value: externalValue,
  ...options
}: {
  children: ReactNode;
  value?: UseInfiniteResult<TItem, TArgs>;
} & UseInfiniteOptions<TItem, TArgs>) => {
  const result = useInfinite<TItem, TArgs>(options);
  const value = externalValue ?? result;

  return <InfiniteCtx.Provider value={value}>{children}</InfiniteCtx.Provider>;
};
