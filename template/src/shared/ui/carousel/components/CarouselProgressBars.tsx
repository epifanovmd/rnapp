import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import { useCarousel } from "../carousel-context";
import { ICarouselProgressBarsProps } from "../carousel-progress-bars.types";
import { useCarouselProgressTimer } from "../hooks/useCarouselProgressTimer";
import { getProgressBarsTop } from "./carousel-progress-bars.utils";
import { CarouselProgressBar } from "./CarouselProgressBar";

export type {
  ICarouselProgressBarsProps,
  TCarouselProgressBarsIdleVariant,
  TCarouselProgressBarsMode,
  TCarouselProgressBarsPlacement,
  TCarouselProgressBarsPosition,
} from "../carousel-progress-bars.types";

/** Полосы прогресса прокрутки или автоплея. */
export const CarouselProgressBars: FC<ICarouselProgressBarsProps> = memo(
  ({
    mode = "scroll",
    idleVariant = "fill",
    position = "top",
    placement = "inside",
    inset = 8,
    height = 3,
    gap = 4,
    color = "#FFFFFF",
    trackColor = "rgba(255, 255, 255, 0.4)",
    style,
  }) => {
    const { count, height: carouselHeight } = useCarousel();
    const { timer, timerIndex } = useCarouselProgressTimer(mode);
    const top = getProgressBarsTop({
      position,
      placement,
      inset,
      barHeight: height,
      carouselHeight,
    });

    return (
      <View
        pointerEvents={"none"}
        style={[
          styles.container,
          { top, left: inset, right: inset, gap },
          style,
        ]}
      >
        {Array.from({ length: count }, (_, index) => (
          <View
            key={index}
            style={[
              styles.track,
              {
                height,
                borderRadius: height / 2,
                backgroundColor: trackColor,
              },
            ]}
          >
            <CarouselProgressBar
              index={index}
              mode={mode}
              idleVariant={idleVariant}
              timer={timer}
              timerIndex={timerIndex}
              color={color}
            />
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    zIndex: 1,
  },
  track: {
    flex: 1,
    overflow: "hidden",
  },
});
