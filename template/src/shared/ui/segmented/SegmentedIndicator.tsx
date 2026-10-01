import { useTheme } from "@shared/lib/theme";
import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import {
  ISegmentLayout,
  SEGMENT_RADIUS,
  SEGMENT_TRACK_PADDING,
} from "./segment-indicator";

export interface ISegmentedIndicatorProps {
  layouts: SharedValue<ISegmentLayout[]>;
  /** Дробный индекс выбранного сегмента */
  progress: SharedValue<number>;
}

/** Подложка выбранного сегмента на Reanimated: едет к анимированному индексу. */
export const SegmentedIndicator = ({
  layouts,
  progress,
}: ISegmentedIndicatorProps) => {
  const { colors } = useTheme();

  const indicatorStyle = useAnimatedStyle(() => {
    const list = layouts.value;
    const position = progress.value;
    const last = list.length - 1;

    if (last < 0 || position < 0) {
      return { opacity: 0 };
    }

    const clamped = Math.min(position, last);
    const from = list[Math.floor(clamped)];
    const to = list[Math.ceil(clamped)];

    if (!from?.width || !to?.width) {
      return { opacity: 0 };
    }

    const t = clamped - Math.floor(clamped);

    return {
      opacity: 1,
      width: from.width + (to.width - from.width) * t,
      transform: [{ translateX: from.x + (to.x - from.x) * t }],
    };
  });

  return (
    <Animated.View
      pointerEvents={"none"}
      style={[
        styles.indicator,
        { backgroundColor: colors.surface },
        indicatorStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: SEGMENT_TRACK_PADDING,
    bottom: SEGMENT_TRACK_PADDING,
    left: 0,
    borderRadius: SEGMENT_RADIUS,
  },
});
