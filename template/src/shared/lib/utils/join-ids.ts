/**
 * Склеивает заданные id через пробел (для `aria-describedby`/`aria-labelledby`).
 * Возвращает `undefined`, если ни одного id нет.
 */
export const joinIds = (
  ...ids: (string | null | undefined)[]
): string | undefined => ids.filter(Boolean).join(" ") || undefined;
