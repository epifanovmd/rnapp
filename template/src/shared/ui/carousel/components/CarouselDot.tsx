import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { ColorValue } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useCarousel } from "../carousel-context";

interface ICarouselDotProps {
  index: number;
  size: number;
  color?: ColorValue;
}

export const CarouselDot: FC<ICarouselDotProps> = memo(
  ({ index, size, color }) => {
    const { colors } = useTheme();
    const { progress, count, loop } = useCarousel();

    const animatedStyle = useAnimatedStyle(() => {
      const rawDistance = Math.abs(progress.value - index);
      const distance = loop
        ? Math.min(rawDistance, count - rawDistance)
        : rawDistance;

      return {
        opacity: interpolate(distance, [0, 1], [1, 0.35], Extrapolation.CLAMP),
        transform: [
          {
            scale: interpolate(
              distance,
              [0, 1],
              [1.25, 1],
              Extrapolation.CLAMP,
            ),
          },
        ],
      };
    }, [index, count, loop]);

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
  },
);
