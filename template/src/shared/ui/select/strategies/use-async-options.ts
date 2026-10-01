import { useLatestRef } from "@shared/lib/hooks";
import * as React from "react";

import type { SelectDataProps, SelectOption, SelectValue } from "../types";
import { useOptionsRequest } from "./use-options-request";

export interface UseAsyncOptionsConfig<TData, V extends SelectValue> {
  fetch: (query: string, signal: AbortSignal) => Promise<TData[]>;
  getOption: (item: TData) => SelectOption<V>;
  debounce?: number;
  /** Результат пустого запроса кэшируется: повторное открытие и возврат
   *  к пустой строке не перезапрашивают. */
  loadOnce?: boolean;
  /** Смена ключа сбрасывает кэш и перезагружает. */
  fetchKey?: string | number;
  refetchInterval?: number;
  /** Загрузить пустой запрос при монтировании (результат кэшируется). */
  fetchOnMount?: boolean;
  minQueryLength?: number;
  /** `false` — стратегия ничего не загружает. */
  enabled?: boolean;
  /** Строка поиска в триггере (по умолчанию включена). */
  search?: boolean;
}

/** Серверный поиск по открытию и вводу с debounce. */
export const useAsyncOptions = <TData, V extends SelectValue>({
  fetch,
  getOption,
  debounce = 300,
  loadOnce = false,
  fetchKey,
  refetchInterval,
  fetchOnMount = false,
  minQueryLength = 0,
  enabled = true,
  search = true,
}: UseAsyncOptionsConfig<TData, V>): SelectDataProps<V> => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const request = useOptionsRequest<TData, V>(getOption);
  const { run, cancel, setOptions } = request;
  const fetchRef = useLatestRef(fetch);
  const cacheEmpty = loadOnce || fetchOnMount;
  const emptyQueryCacheRef = React.useRef<SelectOption<V>[] | null>(null);

  const load = React.useCallback(
    (q: string) =>
      run(signal => fetchRef.current(q, signal)).then(result => {
        if (result && q === "" && cacheEmpty) {
          emptyQueryCacheRef.current = result;
        }
      }),
    [run, fetchRef, cacheEmpty],
  );

  // fetchOnMount / смена fetchKey — не зависит от open
  React.useEffect(() => {
    emptyQueryCacheRef.current = null;

    if (!enabled || !fetchOnMount) return;

    load("");

    return cancel;
  }, [enabled, fetchOnMount, fetchKey, load, cancel]);

  // open / query — основной fetch
  React.useEffect(() => {
    if (!enabled || !open) return;

    if (query === "" && emptyQueryCacheRef.current) {
      setOptions(emptyQueryCacheRef.current);

      return;
    }

    if (query.length < minQueryLength) {
      // Ниже порога результаты прошлого (длинного) запроса неактуальны.
      if (!emptyQueryCacheRef.current) setOptions([]);

      return;
    }

    const timer = setTimeout(() => load(query), query ? debounce : 0);

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
    load,
    cancel,
    setOptions,
  ]);

  // refetchInterval — поллинг пока открыт
  React.useEffect(() => {
    if (!enabled || !refetchInterval || !open) return;

    const id = setInterval(() => load(query), refetchInterval);

    return () => clearInterval(id);
  }, [enabled, refetchInterval, open, query, load]);

  return {
    options: request.options,
    loading: request.loading,
    error: request.error,
    search,
    searchValue: query,
    onSearch: setQuery,
    onOpenChange: setOpen,
  };
};
