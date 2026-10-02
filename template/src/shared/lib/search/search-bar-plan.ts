/** Что сделать со скрываемой шапкой при открытии поиска. */
export interface ISearchBarOpenPlan {
  /** Спрятать шапку (она видна хотя бы частично). */
  hide: boolean;
  /** На сколько поднять контент вслед за шапкой, px. */
  shift: number;
}

/**
 * Открытие поиска (worklet): видимая шапка уезжает на остаток хода
 * `range − offset`, контент — вместе с ней; уже скрытую не трогать.
 */
export const planSearchBarOpen = (
  offset: number,
  range: number,
): ISearchBarOpenPlan => {
  "worklet";

  const rest = Math.max(range - offset, 0);

  return rest > 0.5 ? { hide: true, shift: rest } : { hide: false, shift: 0 };
};

/**
 * Показать ли шапку при закрытии поиска (worklet): `"show"` — всегда,
 * `"previous"` — если её спрятал сам поиск.
 */
export const shouldShowBarOnClose = (
  restore: "previous" | "show",
  plan: ISearchBarOpenPlan,
): boolean => {
  "worklet";

  return restore === "show" || plan.hide;
};
