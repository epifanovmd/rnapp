import { createContext } from "react";

import { type IHolderError } from "../holder.types";
import { useCtx } from "../hooks/context-helpers";
import { type UsePollingResult } from "./use-polling-holder";

export const PollingCtx = createContext<UsePollingResult<any, any, any> | null>(
  null,
);

export const usePollingContext = <
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(): UsePollingResult<TData, TArgs, TError> =>
  useCtx(PollingCtx, "Polling") as UsePollingResult<TData, TArgs, TError>;
