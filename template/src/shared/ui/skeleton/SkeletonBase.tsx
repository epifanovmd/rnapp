import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { DimensionValue, StyleSheet, ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useSkeletonPulse, useSkeletonPulseContext } from "./SkeletonGroup";

export interface ISkeletonProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  /** Растяжение в Row/Col-композициях (`<Skeleton flex={1} />`). */
  flex?: number;
  /** Круглая заглушка (аватар); размер задаётся width. */
  circle?: boolean;
  /** Отключить пульсацию (статичная заглушка). */
  animated?: boolean;
}

/**
 * Блок-заглушка произвольной формы: размеры и радиус — пропами, любые другие
 * формы (пилюля, разные углы, абсолютное позиционирование) — через style.
 * Внутри Skeleton.Group пульсирует синхронно с остальными блоками группы.
 * `children` рендерятся поверх (например, вложенные скелетоны на подложке).
 */
export const SkeletonBase: FC<ISkeletonProps> = memo(
  ({
    width = "100%",
    height = 16,
    borderRadius = 6,
    flex,
    circle,
    animated = true,
    style,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();
    const groupPulse = useSkeletonPulseContext();
    // Собственный пульс запускается только вне группы.
    const ownPulse = useSkeletonPulse(animated && !groupPulse);
    const pulse = groupPulse ?? ownPulse;

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: animated ? pulse.value : 1,
    }));

    const size = circle
      ? { width, height: width }
      : { width, height, ...(flex !== undefined && { flex }) };
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
      >
        {children}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
