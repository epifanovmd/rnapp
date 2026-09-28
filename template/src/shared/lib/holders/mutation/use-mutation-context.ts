import { createContext } from "react";

import { type IHolderError } from "../holder.types";
import { useCtx } from "../hooks/context-helpers";
import { type UseMutationResult } from "./use-mutation-holder";

export const MutationCtx = createContext<UseMutationResult<
  any,
  any,
  any
> | null>(null);

export const useMutationContext = <
  TArgs = void,
  TData = void,
  TError extends IHolderError = IHolderError,
>(): UseMutationResult<TArgs, TData, TError> =>
  useCtx(MutationCtx, "Mutation") as UseMutationResult<TArgs, TData, TError>;
