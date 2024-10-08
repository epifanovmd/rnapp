import { FlexProps, useFlexProps } from "@force-dev/react-mobile";
import React, { FC, memo, useCallback, useMemo } from "react";
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

export interface TouchableProps<T = unknown>
  extends FlexProps,
    Omit<TouchableOpacityProps, "style" | "onPress" | "onLongPress"> {
  onPress?: (value: T, event: GestureResponderEvent) => void;
  onLongPress?: (value: T, event: GestureResponderEvent) => void;
  ctx?: T;
}

export interface Touchable {
  <T = undefined>(props: TouchableProps<T>): ReturnType<FC>;
}

export const Touchable: Touchable = memo(
  ({ onPress, onLongPress, disabled, ctx, children, ...rest }) => {
    const { style, ownProps } = useFlexProps(rest);

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

    const _style = useMemo(
      () => ({ opacity: disabled ? 0.3 : 1, ...style }),
      [disabled, style],
    );

    return (
      <TouchableOpacity
        onPress={_onPress}
        onLongPress={_onLongPress}
        activeOpacity={0.7}
        style={_style}
        disabled={disabled || !onPress}
        {...ownProps}
      >
        {children}
      </TouchableOpacity>
    );
  },
);
