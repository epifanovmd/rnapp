import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../../model";

/**
 * Вспышка поверх пузыря после `scrollToMessage({ highlight: true })`.
 */
interface IHighlightOverlayProps {
  messageId: string;
}

export const HighlightOverlay: FC<IHighlightOverlayProps> = memo(
  ({ messageId }) => {
    const { theme, layout, highlight } = useChatViewContext();

    // Токен меняется на каждый вызов подсветки — повтор того же id сработает.
    const token = useSyncExternalStore(
      highlight.subscribe,
      useCallback(() => highlight.tokenOf(messageId), [highlight, messageId]),
    );

    const opacity = useSharedValue(0);

    useEffect(() => {
      if (token === 0) return;

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

    if (token === 0) return null;

    return (
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, staticStyle, style]}
      />
    );
  },
);

HighlightOverlay.displayName = "HighlightOverlay";
