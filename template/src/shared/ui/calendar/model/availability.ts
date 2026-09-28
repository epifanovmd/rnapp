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
  isDateDisabled?: (date: Date, key: TCalendarDateKey) => boolean;
  /** `Date` берётся только если дело дошло до пользовательского предиката. */
  resolveDate: (key: TCalendarDateKey) => Date;
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
    return rules.isDateDisabled(rules.resolveDate(cell.dateKey), cell.dateKey);
  }

  return false;
};
