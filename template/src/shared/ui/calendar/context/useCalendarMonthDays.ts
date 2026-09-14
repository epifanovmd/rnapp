import { useMemo } from "react";

import type {
  ICalendarDayState,
  ICalendarMonthGrid,
  TCalendarMonthKey,
} from "../calendar.types";
import { getMonthGrid, isSpanAffected } from "../model";
import { buildDayState, EMPTY_SELECTION_INDEX } from "./build-day-state";
import { useCalendarConfig, useCalendarState } from "./calendar-context";

export interface ICalendarMonthDays<TExtra> {
  grid: ICalendarMonthGrid;
  weeks: readonly (readonly ICalendarDayState<TExtra>[])[];
}

/**
 * Дни месяца со всеми посчитанными флагами (выбран, сегодня, недоступен…).
 * Пересчитываются, когда меняется конфиг или выбор, задевающий эту сетку.
 */
export const useCalendarMonthDays = <TExtra = unknown>(
  monthKey: TCalendarMonthKey,
): ICalendarMonthDays<TExtra> => {
  const config = useCalendarConfig<TExtra>();
  const { selection, selectionIndex } = useCalendarState();
  const { firstDayOfWeek, fixedWeeks } = config;

  const grid = getMonthGrid(monthKey, { firstDayOfWeek, fixedWeeks });
  // Если выбор не задевает эту сетку, дни зависят только от конфига — пересчёт не нужен.
  const selectionDep = isSpanAffected(grid.fromKey, grid.toKey, selection)
    ? selectionIndex
    : null;

  const weeks = useMemo(() => {
    const index = selectionDep ?? EMPTY_SELECTION_INDEX;

    return grid.weeks.map(week =>
      week.map(cell => buildDayState(cell, monthKey, config, index)),
    );
  }, [config, grid, monthKey, selectionDep]);

  return { grid, weeks };
};
