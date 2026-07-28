import { type ReactNode } from "react";

import { PollingCtx } from "./use-polling-context";
import {
  usePolling,
  type UsePollingOptions,
  type UsePollingResult,
} from "./use-polling-holder";

export const PollingProvider = <TData, TArgs = void>({
  children,
  value: externalValue,
  ...options
}: {
  children: ReactNode;
  value?: UsePollingResult<TData, TArgs>;
} & UsePollingOptions<TData, TArgs>) => {
  const result = usePolling<TData, TArgs>(options);
  const value = externalValue ?? result;

  return <PollingCtx.Provider value={value}>{children}</PollingCtx.Provider>;
};
