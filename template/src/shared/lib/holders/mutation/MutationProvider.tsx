import { type ReactNode } from "react";

import { MutationCtx } from "./use-mutation-context";
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "./use-mutation-holder";

export const MutationProvider = <TArgs = void, TData = void>({
  children,
  value: externalValue,
  ...options
}: {
  children: ReactNode;
  value?: UseMutationResult<TArgs, TData>;
} & UseMutationOptions<TArgs, TData>) => {
  const result = useMutation<TArgs, TData>(options);
  const value = externalValue ?? result;

  return <MutationCtx.Provider value={value}>{children}</MutationCtx.Provider>;
};
