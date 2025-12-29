import { useTheme } from "@core";
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
import { Text } from "../text";

export interface IChipProps extends TouchableOpacityProps {
  text?: string;
  isActive?: boolean;
  leftIcon?: TIconName;
  rightIcon?: TIconName;
  iconSize?: number;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const Chip = memo<PropsWithChildren<IChipProps>>(
  ({
    text,
    style,
    isActive,
    leftIcon,
    rightIcon,
    iconSize = 14,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();

    const active = useSharedValue(isActive ? 1 : 0);

    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: withTiming(
        interpolateColor(
          active.value,
          isActive ? [0, 1] : [1, 0],
          isActive
            ? [colors.buttonSecondaryBackground, colors.buttonPrimaryBackground]
            : [
                colors.buttonPrimaryBackground,
                colors.buttonSecondaryBackground,
              ],
        ),
        {
          duration: 150,
        },
      ),
    }));

    useEffect(() => {
      active.set(isActive ? 1 : 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    const iconProps = {
      height: iconSize,
      width: iconSize,
    };

    return (
      <AnimatedTouchableOpacity
        activeOpacity={1}
        style={[SS.container, style, animatedStyle]}
        {...rest}
      >
        {leftIcon && <Icon name={leftIcon} {...iconProps} />}
        <Text color={"white"}>{text ?? children}</Text>
        {rightIcon && <Icon name={rightIcon} {...iconProps} />}
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
    // height: 32,
  },
});
