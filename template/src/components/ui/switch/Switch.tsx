import { useTheme } from "@core";
import { memo, PropsWithChildren, useCallback, useEffect } from "react";
import {
  Insets,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export interface ISwitchProps extends Omit<PressableProps, "onPress"> {
  isActive?: boolean;
  onChange?: (active: boolean) => void;
  duration?: number;
}

const hitSlop: Insets = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Switch = memo<PropsWithChildren<ISwitchProps>>(
  ({ isActive, duration = 250, style, disabled, onChange, ...rest }) => {
    const position = useSharedValue(isActive ? 1 : 0);
    const { colors } = useTheme();

    useEffect(() => {
      position.value = withTiming(isActive ? 1 : 0, { duration });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => {
      const translateX = interpolate(position.value, [0, 1], [0, 20]);

      const scale = interpolate(
        position.value,
        [0, 0.5, 1],
        [1, 0.9, 1],
        Extrapolation.CLAMP,
      );

      const opacity = withTiming(
        interpolate(disabled ? 1 : 0, [0, 1], [1, 0.6], Extrapolation.CLAMP),
        { duration },
      );

      return {
        backgroundColor: interpolateColor(
          position.value,
          [0, 1],
          [colors.secondaryBright, colors.primaryBright],
        ),
        opacity,
        transform: [
          {
            translateX,
          },
          { scale },
        ],
      };
    }, [disabled, colors, duration]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
      backgroundColor: withTiming(
        interpolateColor(
          disabled ? 0 : 1,
          [0, 1],
          [colors.onSurfaceDisabled, colors.onSurfaceMedium],
        ),
      ),
    }));

    const handlePress = useCallback(() => {
      onChange?.(!isActive);
    }, [onChange, isActive]);

    return (
      <AnimatedPressable
        style={[SS.container, animatedContainerStyle, style]}
        onPress={handlePress}
        disabled={disabled}
        hitSlop={hitSlop}
        {...rest}
      >
        <View style={[SS.content]}>
          <Animated.View style={[SS.switch, animatedStyle]} />
        </View>
      </AnimatedPressable>
    );
  },
);

const SS = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 2,
    height: 24,
    width: 48,
  },
  content: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden",
  },
  switch: {
    height: "100%",
    borderRadius: 12,
    width: 24,
  },
});
