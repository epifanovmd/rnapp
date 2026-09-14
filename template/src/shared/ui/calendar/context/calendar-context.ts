import { createContext, useContext } from "react";

import type {
  ICalendarActions,
  ICalendarResolvedConfig,
  ICalendarState,
} from "../calendar.types";
import type { ISelectionIndex } from "../model";

export interface ICalendarStateContext extends ICalendarState {
  /** Выбор в форме, удобной для быстрых проверок по ключу дня. */
  selectionIndex: ISelectionIndex;
}

/**
 * Три контекста вместо одного, потому что меняются они с разной частотой:
 * конфиг — редко, состояние — на каждый тап, экшены — почти никогда.
 * Подписчик перерисовывается только когда меняется то, что он читает.
 */
export const CalendarConfigContext =
  createContext<ICalendarResolvedConfig<any> | null>(null);
export const CalendarStateContext = createContext<ICalendarStateContext | null>(
  null,
);
export const CalendarActionsContext = createContext<ICalendarActions | null>(
  null,
);

const missing = (name: string): never => {
  throw new Error(`${name} должен использоваться внутри Calendar/CalendarList`);
};

export const useCalendarConfig = <
  TExtra = unknown,
>(): ICalendarResolvedConfig<TExtra> =>
  useContext(CalendarConfigContext) ?? missing("useCalendarConfig");

export const useCalendarState = (): ICalendarStateContext =>
  useContext(CalendarStateContext) ?? missing("useCalendarState");

export const useCalendarActions = (): ICalendarActions =>
  useContext(CalendarActionsContext) ?? missing("useCalendarActions");

/** Все три контекста разом — для кастомных render-функций. */
export const useCalendar = <TExtra = unknown>() => {
  const config = useCalendarConfig<TExtra>();
  const state = useCalendarState();
  const actions = useCalendarActions();

  return { config, state, actions };
};
