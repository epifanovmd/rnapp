import React, { FC, memo } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { useCarousel } from "../carousel-context";
import { ICarouselPositionedControlProps } from "../carousel-control.types";
import { CarouselDot } from "./CarouselDot";

export interface ICarouselDotsProps extends ICarouselPositionedControlProps {
  size?: number;
  gap?: number;
  /** Цвет точек; по умолчанию primary темы. */
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

/** Точки-пагинация; активная точка вычисляется на UI-потоке. */
export const CarouselDots: FC<ICarouselDotsProps> = memo(
  ({ size = 6, gap = 6, color, style }) => {
    const { count } = useCarousel();

    return (
      <View style={[styles.container, { gap }, style]}>
        {Array.from({ length: count }, (_, index) => (
          <CarouselDot key={index} index={index} size={size} color={color} />
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
    padding: 8,
  },
});
