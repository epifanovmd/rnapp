import { useTheme } from "@core";
import * as React from "react";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { Insets, Pressable, PressableProps, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "../icon";

export interface CheckboxProps extends Omit<PressableProps, "onPress"> {
  isActive?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  circe?: boolean;
  duration?: number;
}

const hitSlop: Insets = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Checkbox: React.FC<PropsWithChildren<CheckboxProps>> = ({
  isActive = true,
  onChange,
  disabled,
  circe,
  duration = 250,
  style,
  ...rest
}) => {
  const animatedActive = useSharedValue(isActive ? 1 : 0);
  const { colors } = useTheme();

  useEffect(() => {
    animatedActive.value = withTiming(isActive ? 1 : 0, { duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const handlePress = useCallback(() => {
    onChange?.(!isActive);
  }, [isActive, onChange]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(
      animatedActive.value,
      [0, 1],
      [2, 0],
      Extrapolation.CLAMP,
    );

    const backgroundColor = interpolateColor(
      animatedActive.value,
      [0, 1],
      [colors.transparent, colors.blue500],
    );

    const opacity = withTiming(
      interpolate(disabled ? 1 : 0, [0, 1], [1, 0.6], Extrapolation.CLAMP),
      { duration },
    );

    return {
      borderWidth,
      backgroundColor,
      borderColor: colors.slate400,
      opacity,
    };
  }, [disabled, colors, duration]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animatedActive.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      animatedActive.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <AnimatedPressable
      style={[
        SS.container,
        { borderRadius: circe ? 12 : 8 },
        animatedContainerStyle,
      ]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={hitSlop}
      {...rest}
    >
      <Animated.View style={[SS.content, animatedIconStyle]}>
        <Icon height={16} width={16} name={"checkBold"} fill={colors.white} />
      </Animated.View>
    </AnimatedPressable>
  );
};

const SS = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "solid",
    width: 24,
    height: 24,
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
});
