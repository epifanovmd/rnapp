import React, { FC, memo } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { useCarousel } from "../carousel-context";
import { CarouselDot } from "./CarouselDot";

export interface ICarouselDotsProps {
  size?: number;
  gap?: number;
  /** Цвет точек; по умолчанию primary темы. */
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
}

/** Точки-пагинация под каруселью; активная — worklet по прогрессу. */
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
    marginTop: 8,
  },
});
