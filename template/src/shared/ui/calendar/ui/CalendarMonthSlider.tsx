import { useConstant } from "@shared/lib/hooks";
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
  useCalendarState,
} from "../context";
import {
  addMonths,
  diffMonths,
  getMonthGrid,
  weeksBlockHeight,
} from "../model";
import { CalendarSlidePage } from "./CalendarSlidePage";

export interface ICalendarMonthSliderProps {
  monthKey: TCalendarMonthKey;
  duration: number;
  /** Свайпы влево/вправо переключают месяц. */
  gestureEnabled: boolean;
}

type TDirection = 1 | -1;

/** Какую долю ширины нужно протянуть, чтобы свайп засчитался. */
const SWIPE_THRESHOLD = 0.3;
/** Насколько скорость пальца «дотягивает» свайп: быстрый короткий жест тоже засчитывается. */
const VELOCITY_TOSS = 0.15;
/** Во сколько раз медленнее страница идёт за пальцем, если в эту сторону идти нельзя. */
const RESISTANCE = 0.3;
const EASING = Easing.out(Easing.cubic);

/**
 * Слайдер месяцев.
 *
 * У каждого месяца есть номер относительно стартового, а его позиция считается
 * на UI-потоке: `(номер − page) × ширина + сдвиг пальцем`. Смена месяца — это
 * анимация `page`; свайп двигает `offset`, а по отпусканию `page` и `offset`
 * меняются одним махом там же, на UI-потоке, так что картинка не дёргается.
 * React только добавляет и убирает страницы по ключу. Соседние месяцы
 * смонтированы всегда, поэтому свайп начинается мгновенно.
 */
export const CalendarMonthSlider: FC<ICalendarMonthSliderProps> = memo(
  ({ monthKey, duration, gestureEnabled }) => {
    const { canGoPrev, canGoNext } = useCalendarState();
    const { goToNextMonth, goToPrevMonth, registerNavigator } =
      useCalendarActions();
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

    const width = useSharedValue(0);
    const height = useSharedValue(monthHeight(monthKey));
    const page = useSharedValue(0);
    const offset = useSharedValue(0);

    const [shown, setShown] = useState(monthKey);
    const [outgoing, setOutgoing] = useState<TCalendarMonthKey | null>(null);

    // Провайдер сообщает через навигатор, анимировать ли ближайший переход.
    const animateNextRef = useRef(true);

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

    // Переезд к новому месяцу. Завершаем с UI-потока — к этому моменту значения уже применены.
    useEffect(() => {
      const target = indexOf(shown);
      const targetHeight = monthHeight(shown);
      const animate = animateNextRef.current;

      animateNextRef.current = true;

      runOnUI(() => {
        "worklet";
        if (animate && page.value !== target) {
          height.value = withTiming(targetHeight, { duration, easing: EASING });
          page.value = withTiming(
            target,
            { duration, easing: EASING },
            finished => {
              if (finished) scheduleOnRN(finishTransition);
            },
          );
        } else {
          page.value = target;
          height.value = targetHeight;
          scheduleOnRN(finishTransition);
        }
      })();
    }, [shown, indexOf, monthHeight, duration, page, height, finishTransition]);

    const onContainerLayout = useCallback(
      (event: LayoutChangeEvent) => {
        width.value = event.nativeEvent.layout.width;
      },
      [width],
    );

    /** Свайп доехал до соседа. `page` уже сдвинут на UI-потоке — осталось обновить состояние. */
    const commitSwipe = useCallback(
      (direction: TDirection) => {
        if (direction === 1) goToNextMonth(false);
        else goToPrevMonth(false);
      },
      [goToNextMonth, goToPrevMonth],
    );

    const neighborHeight = useMemo(
      () => ({
        prev: monthHeight(addMonths(shown, -1)),
        next: monthHeight(addMonths(shown, 1)),
      }),
      [monthHeight, shown],
    );

    const pan = useMemo(
      () =>
        Gesture.Pan()
          .enabled(gestureEnabled)
          .activeOffsetX([-12, 12])
          .failOffsetY([-12, 12])
          .onUpdate(event => {
            "worklet";
            const x = event.translationX;
            const blocked = (x > 0 && !canGoPrev) || (x < 0 && !canGoNext);

            offset.value = blocked ? x * RESISTANCE : x;
          })
          .onEnd(event => {
            "worklet";
            const w = width.value;
            const projected =
              event.translationX + event.velocityX * VELOCITY_TOSS;
            let direction: TDirection | 0 = 0;

            if (projected < -w * SWIPE_THRESHOLD && canGoNext) direction = 1;
            else if (projected > w * SWIPE_THRESHOLD && canGoPrev)
              direction = -1;

            if (direction === 0) {
              offset.value = withTiming(0, { duration, easing: EASING });

              return;
            }

            const targetHeight =
              direction === 1 ? neighborHeight.next : neighborHeight.prev;

            height.value = withTiming(targetHeight, {
              duration,
              easing: EASING,
            });
            offset.value = withTiming(
              -direction * w,
              { duration, easing: EASING },
              finished => {
                if (!finished) return;
                // Оба значения меняются в одном кадре, поэтому визуально ничего не сдвигается.
                page.value += direction;
                offset.value = 0;
                scheduleOnRN(commitSwipe, direction);
              },
            );
          }),
      [
        gestureEnabled,
        canGoPrev,
        canGoNext,
        duration,
        neighborHeight,
        offset,
        page,
        height,
        width,
        commitSwipe,
      ],
    );

    const containerStyle = useAnimatedStyle(() => ({ height: height.value }));

    const pages = useMemo(() => {
      const keys = [shown];

      if (outgoing) keys.push(outgoing);
      if (canGoPrev) keys.push(addMonths(shown, -1));
      if (canGoNext) keys.push(addMonths(shown, 1));

      return Array.from(new Set(keys));
    }, [shown, outgoing, canGoPrev, canGoNext]);

    return (
      <GestureDetector gesture={pan}>
        <Animated.View
          onLayout={onContainerLayout}
          style={[SS.container, containerStyle]}
        >
          {pages.map(key => (
            <CalendarSlidePage
              key={key}
              monthKey={key}
              index={indexOf(key)}
              page={page}
              offset={offset}
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
