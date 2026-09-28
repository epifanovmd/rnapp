import { createContext } from "react";

import { type IHolderError } from "../holder.types";
import { useCtx } from "../hooks/context-helpers";
import { type UseInfiniteResult } from "./use-infinite-holder";

export const InfiniteCtx = createContext<UseInfiniteResult<
  any,
  any,
  any
> | null>(null);

export const useInfiniteContext = <
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(): UseInfiniteResult<TItem, TArgs, TError> =>
  useCtx(InfiniteCtx, "Infinite") as UseInfiniteResult<TItem, TArgs, TError>;
