import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useCarousel } from "../carousel-context";
import { ICarouselProgressBarProps } from "../carousel-progress-bars.types";
import { getProgressBarFill } from "./carousel-progress-bar.utils";

export const CarouselProgressBar: FC<ICarouselProgressBarProps> = memo(
  ({ index, mode, idleVariant, timer, timerIndex, color }) => {
    const { progress, count, loop, autoPlayActive, activeIndex, touching } =
      useCarousel();

    const animatedStyle = useAnimatedStyle(() => {
      const fill = getProgressBarFill({
        index,
        mode,
        idleVariant,
        progress: progress.value,
        count,
        loop,
        autoPlayActive: autoPlayActive.value,
        activeIndex: activeIndex.value,
        timerProgress: timer.value,
        timerIndex: timerIndex.value,
        touching: touching.value,
      });

      return {
        width: `${fill.progress * 100}%`,
        alignSelf: fill.alignment,
      };
    }, [index, mode, idleVariant, count, loop]);

    return (
      <Animated.View
        style={[styles.fill, { backgroundColor: color }, animatedStyle]}
      />
    );
  },
);

const styles = StyleSheet.create({
  fill: {
    height: "100%",
  },
});
