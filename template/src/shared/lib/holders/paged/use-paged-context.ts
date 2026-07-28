import { createContext } from "react";

import { type IHolderError } from "../holder.types";
import { useCtx } from "../hooks/context-helpers";
import { type UsePagedResult } from "./use-paged-holder";

export const PagedCtx = createContext<UsePagedResult<any, any, any> | null>(
  null,
);

export const usePagedContext = <
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(): UsePagedResult<TItem, TArgs, TError> =>
  useCtx(PagedCtx, "Paged") as UsePagedResult<TItem, TArgs, TError>;
