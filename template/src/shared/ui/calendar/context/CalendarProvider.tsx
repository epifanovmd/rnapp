import { useConstant, useLatestRef } from "@shared/lib/hooks";
import React, {
  forwardRef,
  PropsWithChildren,
  ReactElement,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";

import type {
  ICalendarActions,
  ICalendarBaseProps,
  ICalendarMonthBounds,
  ICalendarRef,
  ICalendarResolvedConfig,
  TCalendarDateInput,
  TCalendarDateKey,
  TCalendarMonthKey,
  TCalendarSelectionProps,
} from "../calendar.types";
import {
  buildSelectionIndex,
  dateKeyToMonthKey,
  findGridCell,
  firstSelectedKey,
  getMonthGrid,
  monthKeyToDayjs,
  monthToNavigateOnPress,
  resolveMonthBounds,
  toDateKey,
  toMonthKey,
} from "../model";
import { buildDayState } from "./build-day-state";
import {
  CalendarActionsContext,
  CalendarConfigContext,
  CalendarMonthContext,
  CalendarSelectionContext,
  ICalendarSelectionContext,
  TCalendarMonthContext,
} from "./calendar-context";
import { useCalendarMonthNavigation } from "./useCalendarMonthNavigation";
import { useCalendarSelection } from "./useCalendarSelection";
import { useResolvedCalendarConfig } from "./useResolvedCalendarConfig";

export type TCalendarProviderProps<TExtra> = PropsWithChildren<
  ICalendarBaseProps<TExtra> &
    TCalendarSelectionProps & {
      initialMonth?: TCalendarDateInput;
      month?: TCalendarDateInput;
      /** Границы навигации в месяцах от стартового — задаёт список. Без них ходить можно только в пределах `minDate`/`maxDate`. */
      pastMonths?: number;
      futureMonths?: number;
      /** Дефолты, которые у конкретной вью отличаются от общих. */
      defaults?: Partial<Pick<ICalendarBaseProps, "showOutsideDays">>;
    }
>;

const CalendarProviderImpl = <TExtra,>(
  props: TCalendarProviderProps<TExtra>,
  ref: Ref<ICalendarRef>,
) => {
  const {
    children,
    initialMonth,
    month,
    pastMonths,
    futureMonths,
    defaults,
    onMonthChange,
    onDayPress,
    onDayLongPress,
  } = props;

  const resolved = useResolvedCalendarConfig<TExtra>(props, defaults);
  const { locale, todayKey, minKey, maxKey } = resolved;

  const selectionApi = useCalendarSelection(props, locale);
  const { selection, pressDay: selectKey } = selectionApi;
  const selectionRef = useLatestRef(selection);

  // Стартовый месяц берётся один раз при монтировании: initialMonth — не controlled-проп.
  const initialMonthKey = useConstant(() => {
    const selected = firstSelectedKey(selection);

    return toMonthKey(initialMonth) ?? dateKeyToMonthKey(selected ?? todayKey);
  });

  const minMonthKey = minKey ? dateKeyToMonthKey(minKey) : null;
  const maxMonthKey = maxKey ? dateKeyToMonthKey(maxKey) : null;

  // Список ограничен своими месяцами — навигация и кнопки шапки не должны уходить за них.
  const monthBounds = useMemo<ICalendarMonthBounds | null>(
    () =>
      pastMonths === undefined && futureMonths === undefined
        ? null
        : resolveMonthBounds({
            initialMonth: initialMonthKey,
            minMonth: minMonthKey,
            maxMonth: maxMonthKey,
            pastMonths: pastMonths ?? 0,
            futureMonths: futureMonths ?? 0,
          }),
    [pastMonths, futureMonths, initialMonthKey, minMonthKey, maxMonthKey],
  );

  const config = useMemo<ICalendarResolvedConfig<TExtra>>(
    () => ({ ...resolved, initialMonthKey, monthBounds }),
    [resolved, initialMonthKey, monthBounds],
  );
  const configRef = useLatestRef(config);
  const onMonthChangeRef = useLatestRef(onMonthChange);
  const onDayPressRef = useLatestRef(onDayPress);
  const onDayLongPressRef = useLatestRef(onDayLongPress);

  const navigation = useCalendarMonthNavigation({
    initialMonthKey,
    controlledMonthKey: toMonthKey(month),
    minMonthKey: monthBounds?.from ?? minMonthKey,
    maxMonthKey: monthBounds?.to ?? maxMonthKey,
    todayMonthKey: dateKeyToMonthKey(todayKey),
    onMonthChange: useCallback(
      (key: string) =>
        onMonthChangeRef.current?.(
          monthKeyToDayjs(key, configRef.current.locale),
          key,
        ),
      [configRef, onMonthChangeRef],
    ),
  });

  const { monthKey, canGoPrev, canGoNext, goToMonth } = navigation;
  const monthRef = useLatestRef(monthKey);

  /** Полное состояние дня в сетке `monthKey` — для колбэков и проверки доступности. Считается только по факту тапа. */
  const dayStateFor = useCallback(
    (key: TCalendarDateKey, gridMonthKey: TCalendarMonthKey) => {
      const cfg = configRef.current;
      const options = {
        firstDayOfWeek: cfg.firstDayOfWeek,
        fixedWeeks: cfg.fixedWeeks,
      };
      const ownMonthKey = dateKeyToMonthKey(key);
      // День всегда есть в сетке собственного месяца — это запасной вариант, если указали чужую сетку.
      const cell =
        findGridCell(getMonthGrid(gridMonthKey, options), key) ??
        findGridCell(getMonthGrid(ownMonthKey, options), key)!;

      return buildDayState(
        cell,
        cell.isOutside ? gridMonthKey : ownMonthKey,
        cfg,
        buildSelectionIndex(selectionRef.current),
      );
    },
    [configRef, selectionRef],
  );

  const pressDay = useCallback(
    (key: TCalendarDateKey, gridMonthKey = dateKeyToMonthKey(key)) => {
      const day = dayStateFor(key, gridMonthKey);

      if (day.isDisabled) return;

      selectKey(key);
      onDayPressRef.current?.(day);

      const target = monthToNavigateOnPress(
        key,
        monthRef.current,
        configRef.current.navigateOnOutsideDayPress,
      );

      if (target) goToMonth(target);
    },
    [configRef, dayStateFor, goToMonth, monthRef, onDayPressRef, selectKey],
  );

  const longPressDay = useCallback(
    (key: TCalendarDateKey, gridMonthKey = dateKeyToMonthKey(key)) => {
      const day = dayStateFor(key, gridMonthKey);

      if (!day.isDisabled) onDayLongPressRef.current?.(day);
    },
    [dayStateFor, onDayLongPressRef],
  );

  const actions = useMemo<ICalendarActions>(
    () => ({
      pressDay,
      longPressDay,
      goToMonth: navigation.goToMonth,
      goToNextMonth: navigation.goToNextMonth,
      goToPrevMonth: navigation.goToPrevMonth,
      goToToday: navigation.goToToday,
      syncMonth: navigation.syncMonth,
      syncScrollEdges: navigation.syncScrollEdges,
      registerNavigator: navigation.registerNavigator,
    }),
    [pressDay, longPressDay, navigation],
  );

  const selectionState = useMemo<ICalendarSelectionContext>(
    () => ({ selection, selectionIndex: buildSelectionIndex(selection) }),
    [selection],
  );

  const monthState = useMemo<TCalendarMonthContext>(
    () => ({ monthKey, canGoPrev, canGoNext }),
    [monthKey, canGoPrev, canGoNext],
  );

  useImperativeHandle(
    ref,
    () => ({
      goToMonth: navigation.goToMonth,
      goToNextMonth: navigation.goToNextMonth,
      goToPrevMonth: navigation.goToPrevMonth,
      goToToday: navigation.goToToday,
      getMonth: () =>
        monthKeyToDayjs(monthRef.current, configRef.current.locale),
      select: date => {
        const key = toDateKey(date);

        if (key && !dayStateFor(key, dateKeyToMonthKey(key)).isDisabled) {
          selectKey(key);
        }
      },
      setSelection: selectionApi.setSelection,
      clearSelection: selectionApi.clear,
      getSelection: selectionApi.getValue,
    }),
    [navigation, monthRef, configRef, dayStateFor, selectKey, selectionApi],
  );

  return (
    <CalendarConfigContext.Provider value={config}>
      <CalendarActionsContext.Provider value={actions}>
        <CalendarMonthContext.Provider value={monthState}>
          <CalendarSelectionContext.Provider value={selectionState}>
            {children}
          </CalendarSelectionContext.Provider>
        </CalendarMonthContext.Provider>
      </CalendarActionsContext.Provider>
    </CalendarConfigContext.Provider>
  );
};

/** Собирает конфиг, выбор и навигацию в контексты и отдаёт наружу imperative-ref. */
export const CalendarProvider = forwardRef(CalendarProviderImpl) as <TExtra>(
  props: TCalendarProviderProps<TExtra> & { ref?: Ref<ICalendarRef> },
) => ReactElement;
