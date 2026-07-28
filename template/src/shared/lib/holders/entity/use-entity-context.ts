import { createContext } from "react";

import { type IHolderError } from "../holder.types";
import { useCtx } from "../hooks/context-helpers";
import { type UseEntityResult } from "./use-entity-holder";

export const EntityCtx = createContext<UseEntityResult<any, any, any> | null>(
  null,
);

export const useEntityContext = <
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(): UseEntityResult<TData, TArgs, TError> =>
  useCtx(EntityCtx, "Entity") as UseEntityResult<TData, TArgs, TError>;
