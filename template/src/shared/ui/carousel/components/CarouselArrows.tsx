import React, { FC, memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Icon } from "../../icon";
import { useCarousel } from "../carousel-context";

export interface ICarouselArrowsProps {
  /** Отступ кнопок от боковых краёв. */
  inset?: number;
  size?: number;
}

/** Кнопки ‹ › по бокам карусели (prev/next через контекст). */
export const CarouselArrows: FC<ICarouselArrowsProps> = memo(
  ({ inset = 8, size = 32 }) => {
    const { prev, next } = useCarousel();

    const buttonStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ translateY: -size / 2 }],
    };

    return (
      <View pointerEvents={"box-none"} style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          accessibilityRole={"button"}
          accessibilityLabel={"Предыдущий слайд"}
          style={[styles.button, buttonStyle, { left: inset }]}
          onPress={prev}
        >
          <Icon name={"chevronLeft"} size={size * 0.6} color={"#FFFFFF"} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole={"button"}
          accessibilityLabel={"Следующий слайд"}
          style={[styles.button, buttonStyle, { right: inset }]}
          onPress={next}
        >
          <Icon name={"chevronRight"} size={size * 0.6} color={"#FFFFFF"} />
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: "50%",
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});
