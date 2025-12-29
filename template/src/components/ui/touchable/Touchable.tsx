import { useMergedCallback } from "@common";
import React, { memo, useCallback } from "react";
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

export interface ITouchableProps<T = unknown>
  extends FlexProps,
    Omit<TouchableOpacityProps, "style" | "onPress" | "onLongPress"> {
  onPress?: (value: T, event: GestureResponderEvent) => void;
  onLongPress?: (value: T, event: GestureResponderEvent) => void;
  animatedOpacity?: number;
  animatedScale?: number;
  duration?: number;
  ctx?: T;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const _Touchable = <T extends any = undefined>({
  onPress,
  onLongPress,
  disabled,
  ctx,
  children,
  animatedOpacity = 0.8,
  animatedScale = 0.98,
  duration = 150,
  onPressIn: _onPressIn,
  onPressOut: _onPressOut,
  ...rest
}: ITouchableProps<T>) => {
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

  const handlePressIn = useCallback(() => {
    if (animatedOpacity) {
      opacity.value = withTiming(animatedOpacity, { duration });
    }
    if (animatedScale) {
      scale.value = withTiming(animatedScale, { duration });
    }
  }, [animatedOpacity, animatedScale, duration, opacity, scale]);

  const handlePressOut = useCallback(() => {
    if (animatedOpacity) {
      opacity.value = withTiming(1, { duration });
    }
    if (animatedScale) {
      scale.value = withTiming(1, { duration });
    }
  }, [animatedOpacity, animatedScale, duration, opacity, scale]);

  const onPressIn = useMergedCallback(_onPressIn, handlePressIn);
  const onPressOut = useMergedCallback(_onPressOut, handlePressOut);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
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
};

export const Touchable = memo(_Touchable) as typeof _Touchable;
