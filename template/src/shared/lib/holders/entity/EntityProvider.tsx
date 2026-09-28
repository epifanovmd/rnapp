import { type ReactNode } from "react";

import { EntityCtx } from "./use-entity-context";
import {
  useEntity,
  type UseEntityOptions,
  type UseEntityResult,
} from "./use-entity-holder";

export const EntityProvider = <TData, TArgs = void>({
  children,
  value: externalValue,
  ...options
}: {
  children: ReactNode;
  value?: UseEntityResult<TData, TArgs>;
} & UseEntityOptions<TData, TArgs>) => {
  const result = useEntity<TData, TArgs>(options);
  const value = externalValue ?? result;

  return <EntityCtx.Provider value={value}>{children}</EntityCtx.Provider>;
};
