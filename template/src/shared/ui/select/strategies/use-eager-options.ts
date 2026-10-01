import { useLatestRef } from "@shared/lib/hooks";
import * as React from "react";

import type {
  FilterOptionPredicate,
  SelectDataProps,
  SelectOption,
  SelectValue,
} from "../types";
import { useClientSearch } from "./use-client-search";
import { useOptionsRequest } from "./use-options-request";

export interface UseEagerOptionsConfig<TData, V extends SelectValue> {
  fetch: (signal: AbortSignal) => Promise<TData[]>;
  getOption: (item: TData) => SelectOption<V>;
  search?: boolean;
  /** Смена ключа перезагружает список. */
  fetchKey?: string | number;
  filterOption?: boolean | FilterOptionPredicate<V>;
  /** `false` — не загружать (и не показывать loading). */
  enabled?: boolean;
}

export interface UseEagerOptionsResult<
  V extends SelectValue,
> extends SelectDataProps<V> {
  refetch: () => void;
}

/** Загружает весь список один раз (и при смене `fetchKey`). */
export const useEagerOptions = <TData, V extends SelectValue>({
  fetch,
  getOption,
  search,
  fetchKey,
  filterOption,
  enabled = true,
}: UseEagerOptionsConfig<TData, V>): UseEagerOptionsResult<V> => {
  const request = useOptionsRequest<TData, V>(getOption, enabled);
  const fetchRef = useLatestRef(fetch);
  const { run, cancel } = request;

  const refetch = React.useCallback(() => {
    run(signal => fetchRef.current(signal));
  }, [run, fetchRef]);

  React.useEffect(() => {
    if (!enabled) return;

    refetch();

    return cancel;
  }, [enabled, fetchKey, refetch, cancel]);

  const client = useClientSearch(request.options, { search, filterOption });

  return {
    ...client,
    loading: request.loading,
    error: request.error,
    refetch,
  };
};
