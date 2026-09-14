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
  ICalendarRef,
  TCalendarDateInput,
  TCalendarDateKey,
  TCalendarSelectionProps,
} from "../calendar.types";
import {
  buildSelectionIndex,
  dateKeyToMonthKey,
  firstSelectedKey,
  getMonthGrid,
  monthKeyToDayjs,
  monthToNavigateOnPress,
  toDateKey,
  toMonthKey,
} from "../model";
import { buildDayState } from "./build-day-state";
import {
  CalendarActionsContext,
  CalendarConfigContext,
  CalendarStateContext,
  ICalendarStateContext,
} from "./calendar-context";
import { useCalendarMonthNavigation } from "./useCalendarMonthNavigation";
import { useCalendarSelection } from "./useCalendarSelection";
import { useResolvedCalendarConfig } from "./useResolvedCalendarConfig";

export type TCalendarProviderProps<TExtra> = PropsWithChildren<
  ICalendarBaseProps<TExtra> &
    TCalendarSelectionProps & {
      initialMonth?: TCalendarDateInput;
      month?: TCalendarDateInput;
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
    defaults,
    onMonthChange,
    onDayPress,
    onDayLongPress,
  } = props;

  const config = useResolvedCalendarConfig<TExtra>(props, defaults);
  const { locale, todayKey, minKey, maxKey } = config;

  const selectionApi = useCalendarSelection(props, locale);
  const { selection, pressDay: selectKey } = selectionApi;
  const selectionRef = useLatestRef(selection);

  const configRef = useLatestRef(config);
  const onMonthChangeRef = useLatestRef(onMonthChange);
  const onDayPressRef = useLatestRef(onDayPress);
  const onDayLongPressRef = useLatestRef(onDayLongPress);

  // Стартовый месяц берётся один раз при монтировании: initialMonth — не controlled-проп.
  const initialMonthKey = useConstant(() => {
    const selected = firstSelectedKey(selection);

    return toMonthKey(initialMonth) ?? dateKeyToMonthKey(selected ?? todayKey);
  });

  const navigation = useCalendarMonthNavigation({
    initialMonthKey,
    controlledMonthKey: toMonthKey(month),
    minMonthKey: minKey ? dateKeyToMonthKey(minKey) : null,
    maxMonthKey: maxKey ? dateKeyToMonthKey(maxKey) : null,
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

  /** Полное состояние дня для колбэков. Считается только по факту тапа. */
  const dayStateFor = useCallback(
    (key: TCalendarDateKey) => {
      const cfg = configRef.current;
      const monthOfKey = dateKeyToMonthKey(key);
      const cell = getMonthGrid(monthOfKey, {
        firstDayOfWeek: cfg.firstDayOfWeek,
        fixedWeeks: cfg.fixedWeeks,
      })
        .weeks.flat()
        .find(c => c.dateKey === key)!;

      return buildDayState(
        cell,
        monthOfKey,
        cfg,
        buildSelectionIndex(selectionRef.current),
      );
    },
    [configRef, selectionRef],
  );

  const pressDay = useCallback(
    (key: TCalendarDateKey) => {
      selectKey(key);
      onDayPressRef.current?.(dayStateFor(key));

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
    (key: TCalendarDateKey) => onDayLongPressRef.current?.(dayStateFor(key)),
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
      registerNavigator: navigation.registerNavigator,
    }),
    [pressDay, longPressDay, navigation],
  );

  const state = useMemo<ICalendarStateContext>(
    () => ({
      selection,
      selectionIndex: buildSelectionIndex(selection),
      monthKey,
      canGoPrev,
      canGoNext,
    }),
    [selection, monthKey, canGoPrev, canGoNext],
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

        if (key && !dayStateFor(key).isDisabled) selectKey(key);
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
        <CalendarStateContext.Provider value={state}>
          {children}
        </CalendarStateContext.Provider>
      </CalendarActionsContext.Provider>
    </CalendarConfigContext.Provider>
  );
};

/** Собирает конфиг, выбор и навигацию в контексты и отдаёт наружу imperative-ref. */
export const CalendarProvider = forwardRef(CalendarProviderImpl) as <TExtra>(
  props: TCalendarProviderProps<TExtra> & { ref?: Ref<ICalendarRef> },
) => ReactElement;
