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

export interface UseDependentOptionsConfig<
  TData,
  V extends SelectValue,
  TDep = unknown,
> {
  /** Значение, от которого зависят опции. При изменении — перезагрузка;
   *  `null`/`undefined` — список пуст. */
  dependsOn: TDep | null | undefined;
  /** Загрузчик, принимает текущее `dependsOn`. */
  fetch: (dep: TDep, signal: AbortSignal) => Promise<TData[]>;
  /** Маппер элемента в SelectOption. */
  getOption: (item: TData) => SelectOption<V>;
  /** Включить строку поиска. */
  search?: boolean;
  /** Фильтр опций. */
  filterOption?: boolean | FilterOptionPredicate<V>;
  /** Опции, которые показываются вместо спиннера, пока идёт загрузка. */
  placeholderOptions?: SelectOption<V>[];
  enabled?: boolean;
}

/**
 * Каскадные / зависимые опции: перезагружает список при изменении
 * `dependsOn`, пока грузится — показывает `placeholderOptions` (если есть).
 */
export const useDependentOptions = <
  TData,
  V extends SelectValue,
  TDep = unknown,
>({
  dependsOn,
  fetch,
  getOption,
  search,
  filterOption,
  placeholderOptions,
  enabled = true,
}: UseDependentOptionsConfig<TData, V, TDep>): SelectDataProps<V> => {
  // Первый рендер уже «грузится», иначе список мигает пустым до эффекта.
  const request = useOptionsRequest<TData, V>(
    getOption,
    enabled && dependsOn != null,
  );
  const fetchRef = useLatestRef(fetch);
  const { run, cancel, setOptions } = request;

  React.useEffect(() => {
    if (!enabled) return;

    if (dependsOn == null) {
      cancel();
      setOptions([]);

      return;
    }

    run(signal => fetchRef.current(dependsOn, signal));

    return cancel;
  }, [enabled, dependsOn, run, cancel, setOptions, fetchRef]);

  const placeholder = request.loading ? placeholderOptions : undefined;
  const showPlaceholder = placeholder !== undefined;
  const source = placeholder ?? request.options;

  const client = useClientSearch(source, { search, filterOption });

  return {
    ...client,
    loading: request.loading && !showPlaceholder,
    error: request.error,
  };
};
