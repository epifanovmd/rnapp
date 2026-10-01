import type {
  FilterOptionPredicate,
  SelectOption,
  SelectValue,
} from "../types";
import { getOptionText } from "../utils/get-option-text";

export const filterByLabel = <V extends SelectValue>(
  list: SelectOption<V>[],
  query: string,
  predicate?: FilterOptionPredicate<V>,
): SelectOption<V>[] => {
  if (!query) return list;

  if (predicate) {
    return list.filter(o => predicate(query, o));
  }

  const q = query.toLowerCase();

  return list.filter(o => getOptionText(o).toLowerCase().includes(q));
};
