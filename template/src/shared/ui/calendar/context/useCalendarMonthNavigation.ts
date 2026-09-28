import { useLatestRef } from "@shared/lib/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ICalendarNavigator,
  ICalendarScrollEdges,
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
  /** Запрос на смену месяца — откуда бы он ни пришёл: кнопки, свайп, скролл списка, ref. */
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
  syncScrollEdges: (edges: ICalendarScrollEdges) => void;
  registerNavigator: (navigator: ICalendarNavigator | null) => void;
}

const NO_EDGES: ICalendarScrollEdges = { atStart: false, atEnd: false };

/**
 * Текущий месяц и переходы между месяцами. Как именно «доехать» до месяца —
 * решает вью через `registerNavigator`: слайдер анимирует, список скроллит.
 *
 * Семантика как у controlled-инпута: `onMonthChange` — это намерение.
 * Uncontrolled — состояние меняется здесь и вью едет сразу; controlled —
 * только сообщаем родителю, а вью едет, когда он запишет новый `month`.
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
  // Края контента знает только список; у слайдера они всегда «не упёрлись».
  const [edges, setEdges] = useState(NO_EDGES);

  const navigatorRef = useRef<ICalendarNavigator | null>(null);
  const monthRef = useLatestRef(monthKey);
  const controlledRef = useLatestRef(controlledMonthKey !== null);
  const onMonthChangeRef = useLatestRef(onMonthChange);
  /** `animated` последнего controlled-запроса — применяется, когда родитель запишет новый `month`. */
  const pendingAnimatedRef = useRef<boolean | null>(null);

  // Controlled-месяц поменяли снаружи — просим вью доехать до него.
  const prevControlledRef = useRef(controlledMonthKey);

  useEffect(() => {
    const prev = prevControlledRef.current;

    prevControlledRef.current = controlledMonthKey;
    if (!controlledMonthKey || controlledMonthKey === prev) return;

    const animated = pendingAnimatedRef.current ?? true;

    pendingAnimatedRef.current = null;
    navigatorRef.current?.goToMonth(clamp(controlledMonthKey), animated);
  }, [clamp, controlledMonthKey]);

  const goToKey = useCallback(
    (key: TCalendarMonthKey, animated: boolean) => {
      const target = clamp(key);

      if (target === monthRef.current) return;

      if (controlledRef.current) {
        pendingAnimatedRef.current = animated;
      } else {
        setInternal(target);
        navigatorRef.current?.goToMonth(target, animated);
      }
      onMonthChangeRef.current?.(target);
    },
    [clamp, controlledRef, monthRef, onMonthChangeRef],
  );

  /** Вью уже стоит на месяце (скролл списка): состояние догоняет, вью не трогаем. */
  const syncMonth = useCallback(
    (key: TCalendarMonthKey) => {
      if (key === monthRef.current) return;

      if (!controlledRef.current) setInternal(key);
      onMonthChangeRef.current?.(key);
    },
    [controlledRef, monthRef, onMonthChangeRef],
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

  const syncScrollEdges = useCallback((next: ICalendarScrollEdges) => {
    setEdges(prev =>
      prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
    );
  }, []);

  const registerNavigator = useCallback(
    (navigator: ICalendarNavigator | null) => {
      navigatorRef.current = navigator;
    },
    [],
  );

  return useMemo(
    () => ({
      monthKey,
      canGoPrev: !edges.atStart && (!minMonthKey || monthKey > minMonthKey),
      canGoNext: !edges.atEnd && (!maxMonthKey || monthKey < maxMonthKey),
      goToMonth,
      goToNextMonth,
      goToPrevMonth,
      goToToday,
      syncMonth,
      syncScrollEdges,
      registerNavigator,
    }),
    [
      monthKey,
      edges,
      minMonthKey,
      maxMonthKey,
      goToMonth,
      goToNextMonth,
      goToPrevMonth,
      goToToday,
      syncMonth,
      syncScrollEdges,
      registerNavigator,
    ],
  );
};
