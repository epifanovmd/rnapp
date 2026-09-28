import type {
  ICalendarDayState,
  ICalendarGridCell,
  ICalendarResolvedConfig,
  TCalendarMonthKey,
} from "../calendar.types";
import {
  ISelectionIndex,
  isWeekendDay,
  keyToDayjs,
  resolveDayFlags,
} from "../model";

export const EMPTY_SELECTION_INDEX: ISelectionIndex = {
  state: { mode: "none" },
  keys: new Set(),
};

/** Собирает из ячейки сетки, конфига и выбора полное состояние дня. */
export const buildDayState = <TExtra>(
  cell: ICalendarGridCell,
  monthKey: TCalendarMonthKey,
  config: ICalendarResolvedConfig<TExtra>,
  index: ISelectionIndex,
): ICalendarDayState<TExtra> => ({
  ...cell,
  ...resolveDayFlags(cell.dateKey, index),
  date: keyToDayjs(cell.dateKey, config.locale),
  monthKey,
  isToday: cell.dateKey === config.todayKey,
  isDisabled: config.isDayDisabled(cell),
  isWeekend: isWeekendDay(cell.weekday),
  data: config.resolveDayData(cell.dateKey),
});
