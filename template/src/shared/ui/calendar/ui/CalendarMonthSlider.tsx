import { useConstant, useLatestRef } from "@shared/lib/hooks";
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { TCalendarMonthKey } from "../calendar.types";
import {
  useCalendarActions,
  useCalendarConfig,
  useCalendarMonthState,
} from "../context";
import {
  addMonths,
  diffMonths,
  getMonthGrid,
  interpolatePageHeight,
  IPageHeightStop,
  resistPage,
  resolveSlideRange,
  resolveSwipeTarget,
  weeksBlockHeight,
} from "../model";
import { CalendarSlidePage } from "./CalendarSlidePage";

export interface ICalendarMonthSliderProps {
  monthKey: TCalendarMonthKey;
  duration: number;
  /** Свайпы влево/вправо переключают месяц. */
  gestureEnabled: boolean;
}

interface ISlidePage extends IPageHeightStop {
  key: TCalendarMonthKey;
}

const EASING = Easing.out(Easing.cubic);

/**
 * Слайдер месяцев.
 *
 * Единственная позиция — `page` на UI-потоке: номер месяца относительно
 * стартового, дробный пока страница едет или под пальцем. Страница стоит в
 * `(номер − page) × ширина`, а высота контейнера выводится из `page` между
 * высотами смонтированных страниц. Свайп двигает `page` напрямую и подхватывает
 * её где угодно, в том числе посреди незавершённой анимации. По отпусканию цель
 * известна сразу: `page` едет к ней на UI-потоке, а месяц провайдера меняется
 * тут же — шапка и соседние страницы не ждут конца анимации. React только
 * добавляет и убирает страницы по ключу: при включённых жестах соседи
 * смонтированы заранее, без жестов держим только текущий и уходящий.
 */
export const CalendarMonthSlider: FC<ICalendarMonthSliderProps> = memo(
  ({ monthKey, duration, gestureEnabled }) => {
    const { canGoPrev, canGoNext } = useCalendarMonthState();
    const { goToMonth, registerNavigator } = useCalendarActions();
    const { firstDayOfWeek, fixedWeeks, dayHeight, weekGap } =
      useCalendarConfig();

    const monthHeight = useCallback(
      (key: TCalendarMonthKey) =>
        weeksBlockHeight(
          getMonthGrid(key, { firstDayOfWeek, fixedWeeks }).weeks.length,
          dayHeight,
          weekGap,
        ),
      [dayHeight, firstDayOfWeek, fixedWeeks, weekGap],
    );

    const anchor = useConstant(() => monthKey);
    const indexOf = useCallback(
      (key: TCalendarMonthKey) => diffMonths(anchor, key),
      [anchor],
    );
    const keyOf = useCallback(
      (index: number) => addMonths(anchor, index),
      [anchor],
    );

    const width = useSharedValue(0);
    const page = useSharedValue(0);
    const dragStart = useSharedValue(0);

    const [shown, setShown] = useState(monthKey);
    const [outgoing, setOutgoing] = useState<TCalendarMonthKey | null>(null);
    const monthRef = useLatestRef(monthKey);

    // Провайдер сообщает через навигатор, анимировать ли ближайший переход.
    const animateNextRef = useRef(true);
    // Страница, к которой `page` уже едет после свайпа: эффект смены месяца её не перебивает.
    const swipeTargetRef = useRef<number | null>(null);

    useEffect(() => {
      registerNavigator({
        goToMonth: (_, animated) => {
          animateNextRef.current = animated;
        },
      });

      return () => registerNavigator(null);
    }, [registerNavigator]);

    // Месяц сменился: запоминаем уходящий, чтобы он оставался на экране до конца анимации.
    if (shown !== monthKey) {
      setShown(monthKey);
      setOutgoing(shown);
    }

    const finishTransition = useCallback(() => setOutgoing(null), []);
    const timing = useMemo(() => ({ duration, easing: EASING }), [duration]);

    // Переезд к новому месяцу — если страница уже не едет туда после свайпа.
    useEffect(() => {
      const target = indexOf(shown);
      const animate = animateNextRef.current;

      animateNextRef.current = true;
      if (swipeTargetRef.current === target) return;
      swipeTargetRef.current = null;

      runOnUI(() => {
        "worklet";
        if (animate && page.value !== target) {
          page.value = withTiming(target, timing, finished => {
            if (finished) scheduleOnRN(finishTransition);
          });
        } else {
          page.value = target;
          scheduleOnRN(finishTransition);
        }
      })();
    }, [shown, indexOf, timing, page, finishTransition]);

    const onContainerLayout = useCallback(
      (event: LayoutChangeEvent) => {
        width.value = event.nativeEvent.layout.width;
      },
      [width],
    );

    /** Свайп отпущен: страница уже едет к `target`, месяц провайдера догоняет её сразу. */
    const commitSwipe = useCallback(
      (target: number) => {
        swipeTargetRef.current = target;
        goToMonth(keyOf(target));
      },
      [goToMonth, keyOf],
    );

    /** Анимация свайпа доехала. Если провайдер месяц не принял (controlled), возвращаемся к его месяцу. */
    const settleSwipe = useCallback(
      (target: number) => {
        const actual = indexOf(monthRef.current);

        swipeTargetRef.current = null;
        if (actual === target) {
          finishTransition();

          return;
        }

        runOnUI(() => {
          "worklet";
          page.value = withTiming(actual, timing, finished => {
            if (finished) scheduleOnRN(finishTransition);
          });
        })();
      },
      [indexOf, monthRef, page, timing, finishTransition],
    );

    const range = useMemo(
      () => resolveSlideRange(indexOf(shown), canGoPrev, canGoNext),
      [indexOf, shown, canGoPrev, canGoNext],
    );

    const pan = useMemo(
      () =>
        Gesture.Pan()
          .enabled(gestureEnabled)
          .activeOffsetX([-12, 12])
          .failOffsetY([-12, 12])
          .onStart(event => {
            "worklet";
            // Подхватываем страницу там, где она сейчас, — в том числе посреди анимации.
            cancelAnimation(page);
            dragStart.value =
              page.value + event.translationX / Math.max(width.value, 1);
          })
          .onUpdate(event => {
            "worklet";
            page.value = resistPage(
              dragStart.value - event.translationX / Math.max(width.value, 1),
              range,
            );
          })
          .onEnd(event => {
            "worklet";
            const target = resolveSwipeTarget(
              page.value,
              event.velocityX / Math.max(width.value, 1),
              range,
            );

            page.value = withTiming(target, timing, finished => {
              if (finished) scheduleOnRN(settleSwipe, target);
            });
            if (target !== range.current) scheduleOnRN(commitSwipe, target);
          }),
      [
        gestureEnabled,
        range,
        timing,
        page,
        dragStart,
        width,
        commitSwipe,
        settleSwipe,
      ],
    );

    const pages = useMemo<ISlidePage[]>(() => {
      const keys = [shown];

      if (outgoing) keys.push(outgoing);
      if (gestureEnabled && canGoPrev) keys.push(addMonths(shown, -1));
      if (gestureEnabled && canGoNext) keys.push(addMonths(shown, 1));

      return Array.from(new Set(keys))
        .map(key => ({ key, index: indexOf(key), height: monthHeight(key) }))
        .sort((a, b) => a.index - b.index);
    }, [
      shown,
      outgoing,
      gestureEnabled,
      canGoPrev,
      canGoNext,
      indexOf,
      monthHeight,
    ]);

    const containerStyle = useAnimatedStyle(() => ({
      height: interpolatePageHeight(page.value, pages),
    }));

    return (
      <GestureDetector gesture={pan}>
        <Animated.View
          onLayout={onContainerLayout}
          style={[SS.container, containerStyle]}
        >
          {pages.map(({ key, index }) => (
            <CalendarSlidePage
              key={key}
              monthKey={key}
              index={index}
              page={page}
              width={width}
              interactive={key === shown}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    );
  },
);

const SS = StyleSheet.create({
  container: { overflow: "hidden" },
});
