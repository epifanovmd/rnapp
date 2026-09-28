import React, { FC, memo, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Text } from "../../text";
import { useCarousel } from "../carousel-context";

export interface ICarouselCounterProps {
  /** Угол размещения поверх карусели. */
  position?: "top-left" | "top-right";
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Счётчик «3 / 5» поверх карусели. */
export const CarouselCounter: FC<ICarouselCounterProps> = memo(
  ({ position = "top-right", inset = 8, style }) => {
    const { progress, count } = useCarousel();
    const [index, setIndex] = useState(0);

    useAnimatedReaction(
      () => Math.round(progress.value) % count,
      (current, previous) => {
        if (current !== previous) {
          scheduleOnRN(setIndex, current);
        }
      },
      [count],
    );

    return (
      <View
        pointerEvents={"none"}
        style={[
          styles.container,
          { top: inset },
          position === "top-right" ? { right: inset } : { left: inset },
          style,
        ]}
      >
        <Text color={"white"} textStyle={"Caption_M2"}>
          {`${index + 1} / ${count}`}
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});
