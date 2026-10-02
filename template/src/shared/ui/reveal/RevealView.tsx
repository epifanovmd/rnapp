import React, { FC, PropsWithChildren } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { revealStyle, TRevealPreset } from "./reveal-style";

const FULL_RANGE: readonly [number, number] = [0, 1];

export interface IRevealViewProps {
  /** Прогресс 0…1 (например, `useScrollReveal().progress`). */
  progress: SharedValue<number> | Readonly<SharedValue<number>>;
  /** Как появляться. По умолчанию `"slide-up"`. */
  preset?: TRevealPreset;
  /** Исчезать по прогрессу, а не появляться. */
  inverse?: boolean;
  /** Участок прогресса, на котором идёт анимация. По умолчанию `[0, 1]`. */
  range?: readonly [number, number];
  /** Сдвиг для slide, px. По умолчанию 8. */
  distance?: number;
  /** Начальный масштаб для `"scale"`. По умолчанию 0.92. */
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: "auto" | "none" | "box-none" | "box-only";
}

/**
 * Появление по прогрессу на UI-потоке: прозрачность, сдвиг, масштаб — без
 * React-рендера. Пресет задаёт вид, `range` — поэтапность, `inverse` — уход.
 */
export const RevealView: FC<PropsWithChildren<IRevealViewProps>> = ({
  progress,
  preset = "slide-up",
  inverse = false,
  range = FULL_RANGE,
  distance = 8,
  scaleFrom = 0.92,
  style,
  pointerEvents,
  children,
}) => {
  const from = range[0];
  const to = range[1];

  const animatedStyle = useAnimatedStyle(() => {
    const next = revealStyle(progress.value, {
      preset,
      inverse,
      range: [from, to],
      distance,
      scaleFrom,
    });

    return {
      opacity: next.opacity,
      transform: [{ translateY: next.translateY }, { scale: next.scale }],
    };
  }, [progress, preset, inverse, from, to, distance, scaleFrom]);

  return (
    <Animated.View style={[style, animatedStyle]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
};
