import React, { FC, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../../model";

interface IHighlightFlashProps {
  messageId: string;
  token: number;
}

export const HighlightFlash: FC<IHighlightFlashProps> = ({
  messageId,
  token,
}) => {
  const { theme, layout, highlight } = useChatViewContext();
  const opacity = useSharedValue(0);

  useEffect(() => {
    const inMs = layout.highlightAnimateIn * 1000;
    const outMs = layout.highlightAnimateOut * 1000;
    const delayMs = layout.highlightDelay * 1000;

    opacity.value = withTiming(1, { duration: inMs });
    opacity.value = withDelay(
      inMs + delayMs,
      withTiming(0, { duration: outMs }),
    );

    const timeout = setTimeout(
      () => highlight.clear(messageId),
      inMs + delayMs + outMs,
    );

    return () => clearTimeout(timeout);
  }, [token, opacity, layout, highlight, messageId]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const staticStyle = useMemo(
    () => ({
      borderRadius: layout.bubbleCornerRadius,
      backgroundColor: theme.messageHighlightColor,
    }),
    [layout.bubbleCornerRadius, theme.messageHighlightColor],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, staticStyle, style]}
    />
  );
};
