import { useLatestRef } from "@shared/lib/hooks";
import * as React from "react";

import type { SelectOption, SelectValue } from "../types";

export interface OptionsRequestState<V extends SelectValue> {
  options: SelectOption<V>[];
  loading: boolean;
  loadingMore: boolean;
  error: unknown;
}

export type OptionsFetcher<TData> = (signal: AbortSignal) => Promise<TData[]>;

export interface UseOptionsRequestResult<
  TData,
  V extends SelectValue,
> extends OptionsRequestState<V> {
  /** Запускает загрузку, отменяя предыдущую; stale-ответы игнорируются.
   *  Возвращает опции ответа или `undefined`, если запрос отменён/упал. */
  run: (
    fetcher: OptionsFetcher<TData>,
    mode?: "replace" | "append",
  ) => Promise<SelectOption<V>[] | undefined>;
  /** Отменяет текущую загрузку и снимает `loading`. */
  cancel: () => void;
  setOptions: (options: SelectOption<V>[]) => void;
}

/**
 * Ядро fetch-стратегий: AbortController + request-id против гонок,
 * ошибка последней загрузки, маппинг данных в опции.
 *
 * Исключение из правила «async только через `@shared/lib/holders`»:
 * холдеры реактивны лишь внутри `observer`, а стратегии вызываются в
 * обычных компонентах (формы, фильтры таблиц); кроме того, загрузчики
 * стратегий — произвольный `Promise<T[]>` с `AbortSignal`, а не API-ответ
 * `{ data } | { error }`. Исключение ограничено этим модулем.
 */
export const useOptionsRequest = <TData, V extends SelectValue>(
  getOption: (item: TData) => SelectOption<V>,
  initialLoading = false,
): UseOptionsRequestResult<TData, V> => {
  const [state, setState] = React.useState<OptionsRequestState<V>>({
    options: [],
    loading: initialLoading,
    loadingMore: false,
    error: null,
  });

  const controllerRef = React.useRef<AbortController | null>(null);
  const requestIdRef = React.useRef(0);
  const getOptionRef = useLatestRef(getOption);

  const cancel = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestIdRef.current += 1;
    setState(prev =>
      prev.loading || prev.loadingMore
        ? { ...prev, loading: false, loadingMore: false }
        : prev,
    );
  }, []);

  const run = React.useCallback(
    async (
      fetcher: OptionsFetcher<TData>,
      mode: "replace" | "append" = "replace",
    ): Promise<SelectOption<V>[] | undefined> => {
      controllerRef.current?.abort();
      const controller = new AbortController();

      controllerRef.current = controller;
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      const isStale = () =>
        controller.signal.aborted || requestId !== requestIdRef.current;

      setState(prev => ({
        ...prev,
        loading: mode === "replace",
        loadingMore: mode === "append",
        error: null,
      }));

      try {
        const data = await fetcher(controller.signal);

        if (isStale()) return undefined;

        const mapped = data.map(item => getOptionRef.current(item));

        setState(prev => ({
          options: mode === "append" ? [...prev.options, ...mapped] : mapped,
          loading: false,
          loadingMore: false,
          error: null,
        }));

        return mapped;
      } catch (error) {
        if (isStale()) return undefined;

        setState(prev => ({
          options: mode === "append" ? prev.options : [],
          loading: false,
          loadingMore: false,
          error,
        }));

        return undefined;
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [getOptionRef],
  );

  const setOptions = React.useCallback((options: SelectOption<V>[]) => {
    setState(prev => ({ ...prev, options }));
  }, []);

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...state, run, cancel, setOptions };
};
