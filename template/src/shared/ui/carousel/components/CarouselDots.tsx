import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useCarousel } from "../carousel-context";

export interface ICarouselDotsProps {
  size?: number;
  gap?: number;
  /** Цвет точек; по умолчанию primary темы. */
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

interface IDotProps {
  index: number;
  size: number;
  color?: ColorValue;
}

const Dot: FC<IDotProps> = ({ index, size, color }) => {
  const { colors } = useTheme();
  const { progress, count, loop } = useCarousel();

  const animatedStyle = useAnimatedStyle(() => {
    const raw = Math.abs(progress.value - index);
    // loop-карусель: расстояние с учётом перехода через край.
    const distance = loop ? Math.min(raw, count - raw) : raw;

    return {
      opacity: interpolate(distance, [0, 1], [1, 0.35], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(distance, [0, 1], [1.25, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? colors.primary,
        },
        animatedStyle,
      ]}
    />
  );
};

/** Точки-пагинация под каруселью; активная — worklet по прогрессу. */
export const CarouselDots: FC<ICarouselDotsProps> = memo(
  ({ size = 6, gap = 6, color, style }) => {
    const { count } = useCarousel();

    return (
      <View style={[styles.container, { gap }, style]}>
        {Array.from({ length: count }, (_, index) => (
          <Dot key={index} index={index} size={size} color={color} />
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginTop: 8,
  },
});
