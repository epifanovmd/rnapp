import type {
  ICalendarGridCell,
  ICalendarMonthGrid,
  TCalendarDateKey,
  TCalendarMonthKey,
  TCalendarWeekDay,
} from "../calendar.types";
import { makeDateKey, parseMonthKey } from "./date-key";

export interface IMonthGridOptions {
  firstDayOfWeek: TCalendarWeekDay;
  /** Всегда 6 недель. */
  fixedWeeks: boolean;
}

const WEEK_LENGTH = 7;
const MAX_WEEKS = 6;

const daysInMonth = (year: number, month0: number) =>
  new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();

const weekdayOf = (year: number, month0: number, day: number) =>
  new Date(Date.UTC(year, month0, day)).getUTCDay() as TCalendarWeekDay;

const cellFor = (
  year: number,
  month0: number,
  dayOffset: number,
): ICalendarGridCell => {
  // dayOffset может быть меньше 1 или больше числа дней в месяце — Date сам переносит дату в соседний месяц.
  const d = new Date(Date.UTC(year, month0, dayOffset));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  return {
    dateKey: makeDateKey(y, m, day),
    day,
    weekday: d.getUTCDay() as TCalendarWeekDay,
    isOutside: y !== year || m !== month0,
  };
};

/** Строит сетку месяца. Без кэша — см. `getMonthGrid`. */
export const computeMonthGrid = (
  key: TCalendarMonthKey,
  { firstDayOfWeek, fixedWeeks }: IMonthGridOptions,
): ICalendarMonthGrid => {
  const { year, month } = parseMonthKey(key);
  const total = daysInMonth(year, month);
  const leading = (weekdayOf(year, month, 1) - firstDayOfWeek + 7) % 7;
  const neededWeeks = Math.ceil((leading + total) / WEEK_LENGTH);
  const weeksCount = fixedWeeks ? MAX_WEEKS : neededWeeks;

  const weeks: ICalendarGridCell[][] = [];

  for (let w = 0; w < weeksCount; w++) {
    const week: ICalendarGridCell[] = [];

    for (let i = 0; i < WEEK_LENGTH; i++) {
      week.push(cellFor(year, month, w * WEEK_LENGTH + i - leading + 1));
    }
    weeks.push(week);
  }

  // Границы сетки считаются той же формулой, что и ячейки: первая — со смещением 1 − leading, последняя — weeksCount × 7 − leading.
  const fromKey = cellFor(year, month, 1 - leading).dateKey;
  const toKey = cellFor(
    year,
    month,
    weeksCount * WEEK_LENGTH - leading,
  ).dateKey;

  return { key, year, month, daysInMonth: total, weeks, fromKey, toKey };
};

/** Высота блока недель: строки по `dayHeight` с зазорами `weekGap` между ними. */
export const weeksBlockHeight = (
  weeksCount: number,
  dayHeight: number,
  weekGap: number,
): number => weeksCount * dayHeight + Math.max(0, weeksCount - 1) * weekGap;

/** Ячейка сетки по ключу дня; `undefined`, если день в сетку не попадает. */
export const findGridCell = (
  grid: ICalendarMonthGrid,
  key: TCalendarDateKey,
): ICalendarGridCell | undefined => {
  if (key < grid.fromKey || key > grid.toKey) return undefined;

  for (const week of grid.weeks) {
    const cell = week.find(c => c.dateKey === key);

    if (cell) return cell;
  }

  return undefined;
};

const gridCache = new Map<string, ICalendarMonthGrid>();

/** Сетка месяца из кэша. Ключ кэша — месяц, первый день недели и `fixedWeeks`. */
export const getMonthGrid = (
  key: TCalendarMonthKey,
  options: IMonthGridOptions,
): ICalendarMonthGrid => {
  const cacheKey = `${key}|${options.firstDayOfWeek}|${options.fixedWeeks ? 1 : 0}`;
  const cached = gridCache.get(cacheKey);

  if (cached) return cached;

  const grid = computeMonthGrid(key, options);

  gridCache.set(cacheKey, grid);

  return grid;
};
