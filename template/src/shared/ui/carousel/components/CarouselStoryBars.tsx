import React, { FC, memo } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useCarousel } from "../carousel-context";

export type TCarouselStoryBarsMode = "scroll" | "timer";

export type TCarouselStoryBarsIdleVariant = "fill" | "move";

export interface ICarouselStoryBarsProps {
  /**
   * Заполнение активной полоски: "scroll" — по прогрессу прокрутки,
   * "timer" — по таймеру автопрокрутки (stories); без активного автоплея
   * timer-режим работает как пагинация (см. idleVariant).
   */
  mode?: TCarouselStoryBarsMode;
  /**
   * Timer-режим без автопрокрутки: "fill" — пройденные и активная
   * заполнены, свайп меняет полоску на границе; "move" — заполнена только
   * активная, заполнение переезжает на соседнюю по прогрессу жеста.
   */
  idleVariant?: TCarouselStoryBarsIdleVariant;
  /** Отступ от краёв карусели. */
  inset?: number;
  height?: number;
  gap?: number;
  color?: ColorValue;
  trackColor?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

interface IBarProps {
  index: number;
  mode: TCarouselStoryBarsMode;
  idleVariant: TCarouselStoryBarsIdleVariant;
  timer: SharedValue<number>;
  color: ColorValue;
}

const Bar: FC<IBarProps> = ({ index, mode, idleVariant, timer, color }) => {
  const { progress, count, loop, autoPlayActive, activeIndex } = useCarousel();

  const fillStyle = useAnimatedStyle(() => {
    if (mode === "timer") {
      if (!autoPlayActive.value) {
        if (idleVariant === "move") {
          // Единый сегмент переезжает между полосками по прогрессу жеста:
          // остаток прижат к краю, через который сегмент ушёл.
          const signed = progress.value - index;
          const distance = loop
            ? signed - count * Math.round(signed / count)
            : signed;
          const fill = Math.max(0, 1 - Math.abs(distance));

          return {
            width: `${fill * 100}%`,
            alignSelf:
              distance > 0 ? ("flex-end" as const) : ("flex-start" as const),
          };
        }

        // Пройденные и активная заполнены; свайп меняет полоску на границе.
        const fill = Math.min(Math.max(progress.value - index + 1, 0), 1);

        return { width: `${fill * 100}%`, alignSelf: "flex-start" as const };
      }

      // Активная — слот движка; f — смещение прогресса от слота: f>0 —
      // свайп доводит заполнение до конца, f<0 — слайд подъезжает или свайп
      // назад (при f≈-1 ширина 0 при любом таймере — без мигания в кадре
      // смены слота).
      const current = activeIndex.value;

      if (index === current) {
        const offset = progress.value - current;
        const wrapped = loop
          ? offset - count * Math.round(offset / count)
          : offset;
        const f = Math.min(Math.max(wrapped, -1), 1);
        const t = timer.value;
        const fill = f >= 0 ? t + (1 - t) * f : t * (1 + f);

        return { width: `${fill * 100}%`, alignSelf: "flex-start" as const };
      }

      const fill = index < current ? 1 : 0;

      return { width: `${fill * 100}%`, alignSelf: "flex-start" as const };
    }

    const fill = Math.min(Math.max(progress.value - index, 0), 1);

    return { width: `${fill * 100}%`, alignSelf: "flex-start" as const };
  }, [mode, idleVariant, count, loop, index, autoPlayActive]);

  return (
    <Animated.View
      style={[styles.fill, { backgroundColor: color }, fillStyle]}
    />
  );
};

/**
 * Полоски прогресса как в stories: overlay сверху карусели; пройденные
 * заполнены, активная — по прокрутке или таймеру автопрокрутки (mode).
 */
export const CarouselStoryBars: FC<ICarouselStoryBarsProps> = memo(
  ({
    mode = "scroll",
    idleVariant = "fill",
    inset = 8,
    height = 3,
    gap = 4,
    color = "#FFFFFF",
    trackColor = "rgba(255, 255, 255, 0.4)",
    style,
  }) => {
    const { count, autoPlayActive, activeIndex, cycleDuration, touching } =
      useCarousel();
    /** Прогресс таймера активного слайда, 0..1. */
    const timer = useSharedValue(0);

    // Смена слота перезапускает таймер на длительность цикла.
    useAnimatedReaction(
      () => activeIndex.value,
      (current, previous) => {
        if (mode !== "timer" || current === previous) {
          return;
        }

        cancelAnimation(timer);
        timer.value = 0;

        if (autoPlayActive.value && !touching.value) {
          timer.value = withTiming(1, {
            duration: cycleDuration.value,
            easing: Easing.linear,
          });
        }
      },
      [mode],
    );

    // Пауза на время касания, после отпускания — продолжение с остатка
    // (синхронно с движком).
    useAnimatedReaction(
      () => touching.value,
      (isTouching, wasTouching) => {
        if (
          mode !== "timer" ||
          wasTouching === null ||
          isTouching === wasTouching
        ) {
          return;
        }

        if (isTouching) {
          cancelAnimation(timer);
        } else if (autoPlayActive.value && timer.value < 1) {
          timer.value = withTiming(1, {
            duration: (1 - timer.value) * cycleDuration.value,
            easing: Easing.linear,
          });
        }
      },
      [mode],
    );

    return (
      <View
        pointerEvents={"none"}
        style={[
          styles.container,
          { top: inset, left: inset, right: inset, gap },
          style,
        ]}
      >
        {Array.from({ length: count }, (_, index) => (
          <View
            key={index}
            style={[
              styles.track,
              {
                height,
                borderRadius: height / 2,
                backgroundColor: trackColor,
              },
            ]}
          >
            <Bar
              index={index}
              mode={mode}
              idleVariant={idleVariant}
              timer={timer}
              color={color}
            />
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    zIndex: 1,
  },
  track: {
    flex: 1,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
