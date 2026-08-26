import React, { FC, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useChatViewContext } from "../../model";

/** Проявление подсветки, пауза и угасание (мс). */
const IN_MS = 200;
const DELAY_MS = 400;
const OUT_MS = 600;

interface IHighlightFlashProps {
  messageId: string;
  token: number;
}

export const HighlightFlash: FC<IHighlightFlashProps> = ({
  messageId,
  token,
}) => {
  const { colors, highlight } = useChatViewContext();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: IN_MS });
    opacity.value = withDelay(
      IN_MS + DELAY_MS,
      withTiming(0, { duration: OUT_MS }),
    );

    const timeout = setTimeout(
      () => highlight.clear(messageId),
      IN_MS + DELAY_MS + OUT_MS,
    );

    return () => clearTimeout(timeout);
  }, [token, opacity, highlight, messageId]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const fillStyle = useMemo(
    () => ({ backgroundColor: colors.messageHighlightColor }),
    [colors.messageHighlightColor],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, ss.fill, fillStyle, style]}
    />
  );
};

const ss = StyleSheet.create({
  fill: { borderRadius: 18 },
});
