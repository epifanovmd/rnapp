import type { SelectOption, SelectOptionGroup, SelectValue } from "../types";

/** Строка списка шторки. `index` — индекс опции в `options`. */
export type OptionRow<V extends SelectValue> =
  | { kind: "clear"; key: string }
  | { kind: "create"; key: string }
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; option: SelectOption<V>; index: number };

export interface BuildOptionRowsParams<V extends SelectValue> {
  options: SelectOption<V>[];
  groups?: SelectOptionGroup<V>[];
  /** Пункт «Не выбрано» первой строкой (single clearable). */
  withClear?: boolean;
  /** Пункт «Создать «запрос»» перед опциями. */
  withCreate?: boolean;
}

/** Группы, оставшиеся после фильтрации `options`, без пустых. */
export const getVisibleGroups = <V extends SelectValue>(
  groups: SelectOptionGroup<V>[],
  indexByValue: Map<V, number>,
): SelectOptionGroup<V>[] =>
  groups
    .map(group => ({
      ...group,
      options: group.options.filter(option => indexByValue.has(option.value)),
    }))
    .filter(group => group.options.length > 0);

const toOptionRow = <V extends SelectValue>(
  option: SelectOption<V>,
  index: number,
): OptionRow<V> => ({
  kind: "option",
  key: `option:${String(option.value)}`,
  option,
  index,
});

/**
 * Плоские строки списка: «Не выбрано», «Создать», затем опции; при группах —
 * заголовок группы отдельной строкой перед её опциями. Группы показывают
 * только опции, оставшиеся в `options` (после фильтрации).
 */
export const buildOptionRows = <V extends SelectValue>({
  options,
  groups,
  withClear = false,
  withCreate = false,
}: BuildOptionRowsParams<V>): OptionRow<V>[] => {
  const rows: OptionRow<V>[] = [];

  if (withClear) rows.push({ kind: "clear", key: "clear" });
  if (withCreate) rows.push({ kind: "create", key: "create" });

  if (!groups) {
    options.forEach((option, index) => rows.push(toOptionRow(option, index)));

    return rows;
  }

  const indexByValue = new Map<V, number>();

  options.forEach((option, index) => indexByValue.set(option.value, index));

  getVisibleGroups(groups, indexByValue).forEach(group => {
    rows.push({
      kind: "group",
      key: `group:${group.group}`,
      label: group.group,
    });
    group.options.forEach(option =>
      rows.push(toOptionRow(option, indexByValue.get(option.value) ?? -1)),
    );
  });

  return rows;
};

/** Индекс опции в `options` → индекс строки (прокрутка к опции). */
export const mapOptionIndexToRow = <V extends SelectValue>(
  rows: OptionRow<V>[],
): Map<number, number> => {
  const map = new Map<number, number>();

  rows.forEach((row, rowIndex) => {
    if (row.kind === "option") map.set(row.index, rowIndex);
  });

  return map;
};

/** Индексы строк-заголовков групп (прилипающие якоря списка). */
export const getGroupRowIndices = <V extends SelectValue>(
  rows: OptionRow<V>[],
): number[] =>
  rows.reduce<number[]>((acc, row, index) => {
    if (row.kind === "group") acc.push(index);

    return acc;
  }, []);
