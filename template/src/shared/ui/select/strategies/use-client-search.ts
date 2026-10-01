import * as React from "react";

import type {
  FilterOptionPredicate,
  SelectDataProps,
  SelectOption,
  SelectValue,
} from "../types";
import { filterByLabel } from "./filter-by-label";

export interface UseClientSearchConfig<V extends SelectValue> {
  search?: boolean;
  /** `false` — не фильтровать (поиск обрабатывает потребитель через `onSearch`). */
  filterOption?: boolean | FilterOptionPredicate<V>;
}

/** Клиентская фильтрация списка по строке поиска: общая часть стратегий. */
export const useClientSearch = <V extends SelectValue>(
  options: SelectOption<V>[],
  { search, filterOption }: UseClientSearchConfig<V> = {},
): SelectDataProps<V> => {
  const [query, setQuery] = React.useState("");

  const doFilter = !!search && filterOption !== false;
  const predicate =
    typeof filterOption === "function" ? filterOption : undefined;

  const filtered = React.useMemo(
    () => (doFilter ? filterByLabel(options, query, predicate) : options),
    [options, query, doFilter, predicate],
  );

  if (!search) return { options };

  return {
    options: filtered,
    search: true,
    searchValue: query,
    onSearch: setQuery,
  };
};
