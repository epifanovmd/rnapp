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
 * Сдвиг контента во время поиска (worklet): шапка не должна быть скрыта
 * больше, чем прокручен контент, — иначе над ним пустота (фильтр укоротил
 * список, скролл ушёл к началу, а скролл-синхронизация шапки в поиске на
 * паузе). Прокрутка ограничена `maxOffsetY`: событие скролла после
 * укорочения может прийти позже. Сдвиг только растёт.
 */
export const resolveSearchGapShift = (
  shift: number,
  hidden: number,
  scrollY: number,
  maxOffsetY: number,
): number => {
  "worklet";

  const scrolled = Math.min(Math.max(scrollY, 0), Math.max(maxOffsetY, 0));

  return Math.max(shift, hidden - scrolled);
};

/**
 * Показать ли шапку при закрытии поиска (worklet): `"show"` — всегда,
 * `"previous"` — если её спрятал сам поиск или она скрыта больше, чем
 * прокручен контент (`hidden > scrollY`).
 */
export const shouldShowBarOnClose = (
  restore: "previous" | "show",
  plan: ISearchBarOpenPlan,
  hidden = 0,
  scrollY = Number.POSITIVE_INFINITY,
): boolean => {
  "worklet";

  return restore === "show" || plan.hide || hidden > Math.max(scrollY, 0) + 0.5;
};
