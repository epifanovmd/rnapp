import React, { FC, memo, useCallback } from "react";
import {
  GestureResponderEvent,
  Pressable,
  TouchableOpacityProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { FlexProps, useFlexProps } from "../../flexView";

export interface TouchableProps<T = unknown>
  extends FlexProps,
    Omit<TouchableOpacityProps, "style" | "onPress" | "onLongPress"> {
  onPress?: (value: T, event: GestureResponderEvent) => void;
  onLongPress?: (value: T, event: GestureResponderEvent) => void;
  animatedOpacity?: number;
  animatedScale?: number;
  duration?: number;
  ctx?: T;
}

export interface Touchable {
  <T = undefined>(props: TouchableProps<T>): ReturnType<FC>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Touchable: Touchable = memo(
  ({
    onPress,
    onLongPress,
    disabled,
    ctx,
    children,
    animatedOpacity = 0.6,
    animatedScale = 0.99,
    duration = 150,
    ...rest
  }) => {
    const { style, ownProps } = useFlexProps(rest);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    const _onPress = useCallback(
      (event: GestureResponderEvent) => {
        onPress?.(ctx as any, event);
      },
      [ctx, onPress],
    );
    const _onLongPress = useCallback(
      (event: GestureResponderEvent) => {
        onLongPress?.(ctx as any, event);
      },
      [ctx, onLongPress],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        onPressIn={() => {
          if (animatedOpacity) {
            opacity.value = withTiming(animatedOpacity, { duration });
          }
          if (animatedScale) {
            scale.value = withTiming(animatedScale, { duration });
          }
        }}
        onPressOut={() => {
          if (animatedOpacity) {
            opacity.value = withTiming(1, { duration });
          }
          if (animatedScale) {
            scale.value = withTiming(1, { duration });
          }
        }}
        onPress={_onPress}
        onLongPress={_onLongPress}
        activeOpacity={0.7}
        style={[animatedStyle, style]}
        disabled={disabled || !onPress}
        {...ownProps}
      >
        {children}
      </AnimatedPressable>
    );
  },
);
