import type { TCalendarDateKey, TCalendarMonthKey } from "../calendar.types";
import { dateKeyToMonthKey } from "./date-key";

/** На какой месяц перейти после тапа по дню: на месяц этого дня, если он не текущий и переход включён. */
export const monthToNavigateOnPress = (
  dateKey: TCalendarDateKey,
  currentMonthKey: TCalendarMonthKey,
  enabled: boolean,
): TCalendarMonthKey | null => {
  if (!enabled) return null;
  const target = dateKeyToMonthKey(dateKey);

  return target === currentMonthKey ? null : target;
};
