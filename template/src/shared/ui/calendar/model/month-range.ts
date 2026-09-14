import type { TCalendarMonthKey } from "../calendar.types";
import { addMonths, clampMonthKey, diffMonths } from "./date-key";

export interface IMonthRangeOptions {
  initialMonth: TCalendarMonthKey;
  minMonth: TCalendarMonthKey | null;
  maxMonth: TCalendarMonthKey | null;
  pastMonths: number;
  futureMonths: number;
}

/** Первый и последний месяц списка: по `minDate`/`maxDate`, а где их нет — ±N месяцев от стартового. */
export const resolveMonthBounds = ({
  initialMonth,
  minMonth,
  maxMonth,
  pastMonths,
  futureMonths,
}: IMonthRangeOptions): { from: TCalendarMonthKey; to: TCalendarMonthKey } => {
  const anchor = clampMonthKey(initialMonth, minMonth, maxMonth);
  const from = minMonth ?? addMonths(anchor, -Math.max(0, pastMonths));
  const to = maxMonth ?? addMonths(anchor, Math.max(0, futureMonths));

  return from <= to ? { from, to } : { from: to, to: from };
};

/** Последовательные ключи месяцев `from..to` включительно. */
export const buildMonthKeys = (
  from: TCalendarMonthKey,
  to: TCalendarMonthKey,
): TCalendarMonthKey[] => {
  const count = diffMonths(from, to) + 1;
  const keys: TCalendarMonthKey[] = [];

  for (let i = 0; i < count; i++) {
    keys.push(addMonths(from, i));
  }

  return keys;
};

/** Позиция месяца в списке `from..to`; -1, если он за границами. */
export const monthIndexOf = (
  from: TCalendarMonthKey,
  to: TCalendarMonthKey,
  key: TCalendarMonthKey,
): number => {
  if (key < from || key > to) return -1;

  return diffMonths(from, key);
};
