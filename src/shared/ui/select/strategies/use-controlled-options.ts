import { useLatestRef } from "@shared/lib/hooks";
import * as React from "react";

import type {
  FilterOptionPredicate,
  SelectDataProps,
  SelectOption,
  SelectValue,
} from "../types";
import { useClientSearch } from "./use-client-search";

export interface UseControlledOptionsConfig<TData, V extends SelectValue> {
  data: TData[] | undefined;
  getOption: (item: TData) => SelectOption<V>;
  loading?: boolean;
  search?: boolean;
  filterOption?: boolean | FilterOptionPredicate<V>;
}

/** Данные и loading приходят снаружи; хук только маппит и ищет. */
export const useControlledOptions = <TData, V extends SelectValue>({
  data,
  getOption,
  loading,
  search,
  filterOption,
}: UseControlledOptionsConfig<TData, V>): SelectDataProps<V> => {
  const getOptionRef = useLatestRef(getOption);

  const all = React.useMemo(
    () => (data ?? []).map(item => getOptionRef.current(item)),
    [data, getOptionRef],
  );

  const client = useClientSearch(all, { search, filterOption });

  return { ...client, loading };
};
