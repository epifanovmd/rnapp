import { createContext, useContext, useMemo } from "react";

import type {
  ICalendarActions,
  ICalendarResolvedConfig,
  ICalendarState,
} from "../calendar.types";
import type { ISelectionIndex } from "../model";

export interface ICalendarSelectionContext extends Pick<
  ICalendarState,
  "selection"
> {
  /** Выбор в форме, удобной для быстрых проверок по ключу дня. */
  selectionIndex: ISelectionIndex;
}

export type TCalendarMonthContext = Omit<ICalendarState, "selection">;

export interface ICalendarStateContext
  extends ICalendarSelectionContext, TCalendarMonthContext {}

/**
 * Контексты разнесены по частоте изменений: конфиг — редко, выбор — на каждый
 * тап, месяц — на каждый переход, экшены — никогда. Подписчик контекста
 * перерисовывается на любое его изменение, поэтому месяцы читают только выбор,
 * а шапка и слайдер — только месяц.
 */
export const CalendarConfigContext =
  createContext<ICalendarResolvedConfig<any> | null>(null);
export const CalendarSelectionContext =
  createContext<ICalendarSelectionContext | null>(null);
export const CalendarMonthContext = createContext<TCalendarMonthContext | null>(
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

export const useCalendarSelectionState = (): ICalendarSelectionContext =>
  useContext(CalendarSelectionContext) ?? missing("useCalendarSelectionState");

export const useCalendarMonthState = (): TCalendarMonthContext =>
  useContext(CalendarMonthContext) ?? missing("useCalendarMonthState");

export const useCalendarActions = (): ICalendarActions =>
  useContext(CalendarActionsContext) ?? missing("useCalendarActions");

/** Выбор и месяц вместе — подписка на оба контекста. */
export const useCalendarState = (): ICalendarStateContext => {
  const selection = useCalendarSelectionState();
  const month = useCalendarMonthState();

  return useMemo(() => ({ ...selection, ...month }), [selection, month]);
};

/** Все контексты разом — для кастомных render-функций. */
export const useCalendar = <TExtra = unknown>() => {
  const config = useCalendarConfig<TExtra>();
  const state = useCalendarState();
  const actions = useCalendarActions();

  return { config, state, actions };
};
