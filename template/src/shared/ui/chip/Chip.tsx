import { useTheme } from "@shared/lib/theme";
import { memo, PropsWithChildren, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon, TIconName } from "../icon";
import { getTextStyle } from "../text";

export interface IChipProps extends TouchableOpacityProps {
  text?: string;
  isActive?: boolean;
  leftIcon?: TIconName;
  rightIcon?: TIconName;
  iconSize?: number;
}

const ANIMATION_DURATION = 150;
const TEXT_STYLE = getTextStyle("Body_S2");

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Чип-фильтр: неактивный — нейтральная плашка с основным текстом, активный —
 * primary с контрастным контентом; фон и цвет текста анимируются синхронно.
 */
export const Chip = memo<PropsWithChildren<IChipProps>>(
  ({
    text,
    style,
    isActive,
    disabled,
    leftIcon,
    rightIcon,
    iconSize = 14,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();

    const progress = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
      progress.value = withTiming(isActive ? 1 : 0, {
        duration: ANIMATION_DURATION,
      });
    }, [isActive, progress]);

    const containerStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.onSurface, colors.primary],
      ),
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
      color: interpolateColor(
        progress.value,
        [0, 1],
        [colors.textPrimary, colors.primaryForeground],
      ),
    }));

    const iconColor = disabled
      ? colors.textDisabled
      : isActive
        ? colors.primaryForeground
        : colors.textPrimary;

    return (
      <AnimatedTouchableOpacity
        accessibilityRole={"button"}
        accessibilityState={{ selected: !!isActive, disabled: !!disabled }}
        activeOpacity={1}
        disabled={disabled}
        style={[SS.container, disabled && SS.disabled, style, containerStyle]}
        {...rest}
      >
        {leftIcon && <Icon name={leftIcon} size={iconSize} color={iconColor} />}
        <Animated.Text style={[TEXT_STYLE, textAnimatedStyle]}>
          {text ?? children}
        </Animated.Text>
        {rightIcon && (
          <Icon name={rightIcon} size={iconSize} color={iconColor} />
        )}
      </AnimatedTouchableOpacity>
    );
  },
);

const SS = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
