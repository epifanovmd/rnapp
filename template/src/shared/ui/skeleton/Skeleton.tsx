import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, useEffect } from "react";
import { DimensionValue, StyleSheet, ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export interface ISkeletonProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  /** Круглая заглушка (аватар); размер задаётся width. */
  circle?: boolean;
  /** Отключить пульсацию (статичная заглушка). */
  animated?: boolean;
}

const PULSE_DURATION = 700;

/** Заглушка загрузки с пульсацией прозрачности. */
export const Skeleton: FC<ISkeletonProps> = memo(
  ({
    width = "100%",
    height = 16,
    borderRadius = 6,
    circle,
    animated = true,
    style,
    ...rest
  }) => {
    const { colors } = useTheme();
    const pulse = useSharedValue(1);

    useEffect(() => {
      if (animated) {
        pulse.value = withRepeat(
          withTiming(0.5, { duration: PULSE_DURATION }),
          -1,
          true,
        );
      } else {
        cancelAnimation(pulse);
        pulse.value = 1;
      }

      return () => cancelAnimation(pulse);
    }, [animated, pulse]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: pulse.value,
    }));

    const size = circle ? { width, height: width } : { width, height };
    const radius = circle
      ? typeof width === "number"
        ? width / 2
        : 9999
      : borderRadius;

    return (
      <Animated.View
        style={[
          styles.base,
          { backgroundColor: colors.onSurface, borderRadius: radius },
          size,
          animatedStyle,
          style,
        ]}
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
