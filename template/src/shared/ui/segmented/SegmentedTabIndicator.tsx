import { useTheme } from "@shared/lib/theme";
import React, { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import {
  buildIndicatorRanges,
  ISegmentLayout,
  isLayoutComplete,
  SEGMENT_RADIUS,
  SEGMENT_TRACK_PADDING,
} from "./segment-indicator";

export interface ISegmentedTabIndicatorProps {
  /** Позиция пейджера material-top-tabs (нативный драйвер) */
  position: Animated.AnimatedInterpolation<number>;
  layouts: ISegmentLayout[];
  count: number;
}

/**
 * Подложка таб-бара на RN Animated: интерполяция `position` пейджера только в
 * transform, поэтому идёт на нативном драйвере в одном кадре с пейджером — и
 * за пальцем, и при переходе по нажатию. Скруглённые края — отдельные слои,
 * середина — вью 1px со scaleX (как TabBarIndicator в react-native-tab-view),
 * чтобы растяжение не искажало скругление.
 */
export const SegmentedTabIndicator = ({
  position,
  layouts,
  count,
}: ISegmentedTabIndicatorProps) => {
  const { colors } = useTheme();
  const complete = isLayoutComplete(layouts, count);

  const transforms = useMemo(() => {
    if (!complete) {
      return null;
    }

    const ranges = buildIndicatorRanges(layouts, SEGMENT_RADIUS);
    const { inputRange } = ranges;
    const interpolate = (outputRange: number[]) =>
      position.interpolate({ inputRange, outputRange, extrapolate: "clamp" });

    return {
      startCap: [{ translateX: interpolate(ranges.startCapX) }],
      endCap: [{ translateX: interpolate(ranges.endCapX) }],
      body: [
        { translateX: interpolate(ranges.bodyX) },
        { scaleX: interpolate(ranges.bodyScale) },
        { translateX: 0.5 },
      ],
    };
  }, [complete, layouts, position]);

  if (!transforms) {
    return null;
  }

  const backgroundColor = colors.surface;

  return (
    <View pointerEvents={"none"} style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.layer,
          styles.body,
          { backgroundColor, transform: transforms.body },
        ]}
      />
      <Animated.View
        style={[
          styles.layer,
          styles.cap,
          styles.startCap,
          { backgroundColor, transform: transforms.startCap },
        ]}
      />
      <Animated.View
        style={[
          styles.layer,
          styles.cap,
          styles.endCap,
          { backgroundColor, transform: transforms.endCap },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: SEGMENT_TRACK_PADDING,
    bottom: SEGMENT_TRACK_PADDING,
    left: 0,
  },
  body: {
    width: 1,
  },
  cap: {
    width: SEGMENT_RADIUS,
  },
  startCap: {
    borderTopLeftRadius: SEGMENT_RADIUS,
    borderBottomLeftRadius: SEGMENT_RADIUS,
  },
  endCap: {
    borderTopRightRadius: SEGMENT_RADIUS,
    borderBottomRightRadius: SEGMENT_RADIUS,
  },
});
