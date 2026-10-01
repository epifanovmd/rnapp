import { useLatestRef } from "@shared/lib/hooks";
import * as React from "react";

import type { SelectDataProps, SelectOption, SelectValue } from "../types";
import { useOptionsRequest } from "./use-options-request";

export interface UseInfiniteOptionsConfig<TData, V extends SelectValue> {
  fetchPage: (
    query: string,
    page: number,
    signal: AbortSignal,
  ) => Promise<TData[]>;
  getOption: (item: TData) => SelectOption<V>;
  pageSize?: number;
  debounce?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

/** Серверный поиск с постраничной догрузкой по скроллу. */
export const useInfiniteOptions = <TData, V extends SelectValue>({
  fetchPage,
  getOption,
  pageSize = 20,
  debounce = 300,
  minQueryLength = 0,
  enabled = true,
}: UseInfiniteOptionsConfig<TData, V>): SelectDataProps<V> => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [hasMore, setHasMore] = React.useState(false);

  const request = useOptionsRequest<TData, V>(getOption);
  const { run, cancel, setOptions } = request;
  const fetchRef = useLatestRef(fetchPage);
  const pageRef = React.useRef(0);

  const loadPage = React.useCallback(
    (q: string, page: number) =>
      run(
        signal => fetchRef.current(q, page, signal),
        page === 0 ? "replace" : "append",
      ).then(result => {
        if (!result) return;
        pageRef.current = page;
        setHasMore(result.length >= pageSize);
      }),
    [run, fetchRef, pageSize],
  );

  React.useEffect(() => {
    if (!enabled || !open) return;

    if (query.length < minQueryLength) {
      setOptions([]);
      setHasMore(false);

      return;
    }

    const timer = setTimeout(() => loadPage(query, 0), query ? debounce : 0);

    return () => {
      clearTimeout(timer);
      cancel();
    };
  }, [
    enabled,
    open,
    query,
    debounce,
    minQueryLength,
    loadPage,
    cancel,
    setOptions,
  ]);

  const { loading, loadingMore } = request;

  const onScrollEnd = React.useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    loadPage(query, pageRef.current + 1);
  }, [loading, loadingMore, hasMore, query, loadPage]);

  return {
    options: request.options,
    loading,
    loadingMore,
    hasMore,
    error: request.error,
    search: true,
    searchValue: query,
    onSearch: setQuery,
    onScrollEnd,
    onOpenChange: setOpen,
  };
};
