import type { Dayjs } from "dayjs";

import type {
  ICalendarGridCell,
  TCalendarDateKey,
  TCalendarWeekDay,
} from "../calendar.types";

export interface IAvailabilityRules {
  minKey: TCalendarDateKey | null;
  maxKey: TCalendarDateKey | null;
  disabledKeys: ReadonlySet<TCalendarDateKey>;
  disabledWeekDays: ReadonlySet<TCalendarWeekDay>;
  /** Хвосты недоступны для выбора. */
  disableOutside: boolean;
  isDateDisabled?: (date: Dayjs, key: TCalendarDateKey) => boolean;
  /** Dayjs создаётся только если дело дошло до пользовательского предиката. */
  resolveDayjs: (key: TCalendarDateKey) => Dayjs;
}

/** Недоступен ли день. Проверки идут от дешёвых к дорогим, пользовательский предикат — последним. */
export const isDayDisabled = (
  cell: ICalendarGridCell,
  rules: IAvailabilityRules,
): boolean => {
  if (rules.disableOutside && cell.isOutside) return true;
  if (rules.minKey && cell.dateKey < rules.minKey) return true;
  if (rules.maxKey && cell.dateKey > rules.maxKey) return true;
  if (rules.disabledWeekDays.has(cell.weekday)) return true;
  if (rules.disabledKeys.has(cell.dateKey)) return true;
  if (rules.isDateDisabled) {
    return rules.isDateDisabled(rules.resolveDayjs(cell.dateKey), cell.dateKey);
  }

  return false;
};
