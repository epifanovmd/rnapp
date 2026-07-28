import { type ReactNode } from "react";

import { PagedCtx } from "./use-paged-context";
import {
  usePaged,
  type UsePagedOptions,
  type UsePagedResult,
} from "./use-paged-holder";

export const PagedProvider = <TItem, TArgs = void>({
  children,
  value: externalValue,
  ...options
}: {
  children: ReactNode;
  value?: UsePagedResult<TItem, TArgs>;
} & UsePagedOptions<TItem, TArgs>) => {
  const result = usePaged<TItem, TArgs>(options);
  const value = externalValue ?? result;

  return <PagedCtx.Provider value={value}>{children}</PagedCtx.Provider>;
};
