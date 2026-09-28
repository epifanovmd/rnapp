import { createContext } from "react";

import { type IHolderError } from "../holder.types";
import { useCtx } from "../hooks/context-helpers";
import { type UseCollectionResult } from "./use-collection-holder";

export const CollectionCtx = createContext<UseCollectionResult<
  any,
  any,
  any
> | null>(null);

export const useCollectionContext = <
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(): UseCollectionResult<TItem, TArgs, TError> =>
  useCtx(CollectionCtx, "Collection") as UseCollectionResult<
    TItem,
    TArgs,
    TError
  >;
