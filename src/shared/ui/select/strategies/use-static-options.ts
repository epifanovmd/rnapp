import type { SelectDataProps, SelectOption, SelectValue } from "../types";
import {
  useClientSearch,
  type UseClientSearchConfig,
} from "./use-client-search";

export type UseStaticOptionsConfig<V extends SelectValue = string> =
  UseClientSearchConfig<V>;

/** Статический список с опциональным клиентским поиском. */
export const useStaticOptions = <V extends SelectValue>(
  options: SelectOption<V>[],
  config: UseStaticOptionsConfig<V> = {},
): SelectDataProps<V> => useClientSearch(options, config);
