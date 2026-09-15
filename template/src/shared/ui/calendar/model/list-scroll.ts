import type {
  ICalendarScrollEdges,
  TCalendarMonthKey,
} from "../calendar.types";

const OFFSET_TOLERANCE = 1;

/**
 * Доехал ли программный скролл списка до `target` по данным viewability.
 * `lastVisible` — последний месяц, о котором она сообщила за время скролла.
 * Два быстрых перехода подряд дают два конца анимации: первый приходит
 * с прерванного скролла посреди пути, часто раньше любой viewability, и
 * считать его финишем нельзя — иначе шапка прыгнет на промежуточный месяц.
 */
export const isProgrammaticScrollSettled = (
  target: TCalendarMonthKey | null,
  lastVisible: TCalendarMonthKey | null,
): boolean => target !== null && lastVisible === target;

/**
 * Стоит ли список на расчётном offset цели. У конца контента список дальше
 * `maxOffset` не уедет, поэтому цель прижимается к нему; `null` — граница
 * ещё не известна.
 */
export const isScrollAtOffset = (
  offsetY: number,
  targetOffset: number,
  maxOffset: number | null,
): boolean => {
  const reachable =
    maxOffset === null
      ? targetOffset
      : Math.min(targetOffset, Math.max(0, maxOffset));

  return Math.abs(offsetY - reachable) <= OFFSET_TOLERANCE;
};

/**
 * Упёрся ли список в край по текущему offset. `maxOffset` — насколько вообще
 * можно проскроллить; `null`, пока размеры не известны, тогда конец не
 * определяем. Отрицательный `maxOffset` — контент короче вьюпорта.
 */
export const resolveScrollEdges = (
  offsetY: number,
  maxOffset: number | null,
): ICalendarScrollEdges => ({
  atStart: offsetY <= OFFSET_TOLERANCE,
  atEnd: maxOffset !== null && offsetY >= maxOffset - OFFSET_TOLERANCE,
});
