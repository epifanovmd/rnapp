import { useTheme } from "@shared/lib/theme";
import React from "react";
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Text } from "../text";

export interface ISegmentedLabelProps {
  label: string;
  index: number;
  /** Дробный индекс индикатора: цвет зависит от близости к нему. */
  progress: SharedValue<number>;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

/** Подпись сегмента с цветом на Reanimated. */
export const SegmentedLabel = ({
  label,
  index,
  progress,
}: ISegmentedLabelProps) => {
  const { colors } = useTheme();

  const textStyle = useAnimatedStyle(() => {
    const proximity = Math.max(0, 1 - Math.abs(progress.value - index));

    return {
      color: interpolateColor(
        proximity,
        [0, 1],
        [colors.textSecondary, colors.textPrimary],
      ),
    };
  });

  return (
    <AnimatedText textStyle={"Title_S2"} numberOfLines={1} style={textStyle}>
      {label}
    </AnimatedText>
  );
};
