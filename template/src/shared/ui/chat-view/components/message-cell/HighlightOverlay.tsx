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
 *
 * Разделён на подписку и саму вспышку: подсветка — событие редкое, а ячеек на
 * экране много, поэтому shared value и анимированный стиль создаются только у
 * подсвечиваемой ячейки, а остальные платят лишь за чтение токена.
 */
interface IHighlightOverlayProps {
  messageId: string;
}

interface IHighlightFlashProps {
  messageId: string;
  /** Токен подсветки: меняется на каждый вызов, повтор того же id сработает. */
  token: number;
}

const HighlightFlash: FC<IHighlightFlashProps> = ({ messageId, token }) => {
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

export const HighlightOverlay: FC<IHighlightOverlayProps> = memo(
  ({ messageId }) => {
    const { highlight } = useChatViewContext();

    const token = useSyncExternalStore(
      highlight.subscribe,
      useCallback(() => highlight.tokenOf(messageId), [highlight, messageId]),
    );

    if (token === 0) return null;

    return <HighlightFlash messageId={messageId} token={token} />;
  },
);

HighlightOverlay.displayName = "HighlightOverlay";
