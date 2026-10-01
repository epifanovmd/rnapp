import { useTheme } from "@shared/lib/theme";
import React, { ReactNode } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Text } from "../text";
import { Touchable } from "../touchable";

export interface ISegmentedItemProps {
  index: number;
  label: ReactNode;
  icon?: ReactNode;
  active: boolean;
  disabled?: boolean;
  fill?: boolean;
  /** Дробный индекс индикатора: цвет текста зависит от близости к нему. */
  progress: SharedValue<number>;
  onPress: (index: number) => void;
  onLayout: (index: number, event: LayoutChangeEvent) => void;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

/** Сегмент переключателя с анимированным цветом подписи. */
export const SegmentedItem = ({
  index,
  label,
  icon,
  active,
  disabled,
  fill,
  progress,
  onPress,
  onLayout,
}: ISegmentedItemProps) => {
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
    <Touchable
      ctx={index}
      disabled={disabled}
      onPress={onPress}
      onLayout={event => onLayout(index, event)}
      style={[styles.item, fill && styles.fill, disabled && styles.disabled]}
      accessibilityRole={"radio"}
      accessibilityState={{ selected: active, disabled }}
    >
      {icon}
      {typeof label === "string" ? (
        <AnimatedText
          textStyle={"Title_S2"}
          numberOfLines={1}
          style={textStyle}
        >
          {label}
        </AnimatedText>
      ) : (
        label
      )}
    </Touchable>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  fill: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
