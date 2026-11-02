import { type ReactNode } from "react";

import { CollectionCtx } from "./use-collection-context";
import {
  useCollection,
  type UseCollectionOptions,
  type UseCollectionResult,
} from "./use-collection-holder";

export const CollectionProvider = <TItem, TArgs = void>({
  children,
  value: externalValue,
  ...options
}: {
  children: ReactNode;
  value?: UseCollectionResult<TItem, TArgs>;
} & UseCollectionOptions<TItem, TArgs>) => {
  const result = useCollection<TItem, TArgs>(options);
  const value = externalValue ?? result;

  return (
    <CollectionCtx.Provider value={value}>{children}</CollectionCtx.Provider>
  );
};
