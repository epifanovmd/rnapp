import { useLatestRef } from "@shared/lib/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ICalendarNavigator,
  TCalendarDateInput,
  TCalendarMonthKey,
} from "../calendar.types";
import { addMonths, clampMonthKey, toMonthKey } from "../model";

export interface IMonthNavigationOptions {
  initialMonthKey: TCalendarMonthKey;
  /** Контролируемый месяц (ключ) либо `null`. */
  controlledMonthKey: TCalendarMonthKey | null;
  minMonthKey: TCalendarMonthKey | null;
  maxMonthKey: TCalendarMonthKey | null;
  todayMonthKey: TCalendarMonthKey;
  onMonthChange?: (monthKey: TCalendarMonthKey) => void;
}

export interface IMonthNavigationApi {
  monthKey: TCalendarMonthKey;
  canGoPrev: boolean;
  canGoNext: boolean;
  goToMonth: (month: TCalendarDateInput, animated?: boolean) => void;
  goToNextMonth: (animated?: boolean) => void;
  goToPrevMonth: (animated?: boolean) => void;
  goToToday: (animated?: boolean) => void;
  syncMonth: (monthKey: TCalendarMonthKey) => void;
  registerNavigator: (navigator: ICalendarNavigator | null) => void;
}

/**
 * Текущий месяц и переходы между месяцами. Состояние здесь, а как именно
 * «доехать» до месяца — решает вью через `registerNavigator`: слайдер
 * анимирует, список скроллит.
 */
export const useCalendarMonthNavigation = ({
  initialMonthKey,
  controlledMonthKey,
  minMonthKey,
  maxMonthKey,
  todayMonthKey,
  onMonthChange,
}: IMonthNavigationOptions): IMonthNavigationApi => {
  const clamp = useCallback(
    (key: TCalendarMonthKey) => clampMonthKey(key, minMonthKey, maxMonthKey),
    [minMonthKey, maxMonthKey],
  );

  const [internal, setInternal] = useState(() => clamp(initialMonthKey));
  const monthKey = clamp(controlledMonthKey ?? internal);

  const navigatorRef = useRef<ICalendarNavigator | null>(null);
  const monthRef = useLatestRef(monthKey);
  const onMonthChangeRef = useLatestRef(onMonthChange);

  // onMonthChange зовём по факту смены, откуда бы она ни пришла: кнопки, свайп, скролл, controlled-проп.
  const prevRef = useRef(monthKey);

  useEffect(() => {
    if (prevRef.current !== monthKey) {
      prevRef.current = monthKey;
      onMonthChangeRef.current?.(monthKey);
    }
  }, [monthKey, onMonthChangeRef]);

  // Controlled-месяц поменяли снаружи — просим вью доехать до него.
  const controlledRef = useRef(controlledMonthKey);

  useEffect(() => {
    if (controlledMonthKey && controlledMonthKey !== controlledRef.current) {
      navigatorRef.current?.goToMonth(clamp(controlledMonthKey), true);
    }
    controlledRef.current = controlledMonthKey;
  }, [clamp, controlledMonthKey]);

  const syncMonth = useCallback((key: TCalendarMonthKey) => {
    setInternal(key);
  }, []);

  const goToKey = useCallback(
    (key: TCalendarMonthKey, animated: boolean) => {
      const target = clamp(key);

      if (target === monthRef.current) return;
      setInternal(target);
      navigatorRef.current?.goToMonth(target, animated);
    },
    [clamp, monthRef],
  );

  const goToMonth = useCallback(
    (month: TCalendarDateInput, animated = true) => {
      const key = toMonthKey(month);

      if (key) goToKey(key, animated);
    },
    [goToKey],
  );

  const goToNextMonth = useCallback(
    (animated = true) => goToKey(addMonths(monthRef.current, 1), animated),
    [goToKey, monthRef],
  );
  const goToPrevMonth = useCallback(
    (animated = true) => goToKey(addMonths(monthRef.current, -1), animated),
    [goToKey, monthRef],
  );
  const goToToday = useCallback(
    (animated = true) => goToKey(todayMonthKey, animated),
    [goToKey, todayMonthKey],
  );

  const registerNavigator = useCallback(
    (navigator: ICalendarNavigator | null) => {
      navigatorRef.current = navigator;
    },
    [],
  );

  return useMemo(
    () => ({
      monthKey,
      canGoPrev: !minMonthKey || monthKey > minMonthKey,
      canGoNext: !maxMonthKey || monthKey < maxMonthKey,
      goToMonth,
      goToNextMonth,
      goToPrevMonth,
      goToToday,
      syncMonth,
      registerNavigator,
    }),
    [
      monthKey,
      minMonthKey,
      maxMonthKey,
      goToMonth,
      goToNextMonth,
      goToPrevMonth,
      goToToday,
      syncMonth,
      registerNavigator,
    ],
  );
};
