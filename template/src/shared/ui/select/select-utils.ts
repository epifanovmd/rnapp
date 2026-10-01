import { SelectOption, SelectValue } from "./types";

/** Текст варианта для поля и поиска. */
export const optionText = <V extends SelectValue>(
  option: SelectOption<V>,
): string =>
  option.textLabel ??
  (typeof option.label === "string" || typeof option.label === "number"
    ? String(option.label)
    : String(option.value));

/** Варианты, чей текст содержит запрос (без учёта регистра). */
export const filterOptions = <V extends SelectValue>(
  options: SelectOption<V>[],
  query: string,
): SelectOption<V>[] => {
  const q = query.trim().toLowerCase();

  if (!q) return options;

  return options.filter(option =>
    `${optionText(option)} ${option.description ?? ""}`
      .toLowerCase()
      .includes(q),
  );
};
