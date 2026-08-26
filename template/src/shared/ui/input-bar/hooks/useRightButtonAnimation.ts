import { useEffect } from "react";
import {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { INPUT_BAR_BUTTON_SIZE } from "../config";

/**
 * Анимация ширины правой кнопки (mic).
 * Когда micVisible=false, ширина уходит в 0 — бар плавно расширяется вправо.
 * Скрытие правой кнопки и пересчёт layout входного стека.
 */
export function useRightButtonAnimation(micVisible: boolean) {
  const micButtonWidthSV = useSharedValue(INPUT_BAR_BUTTON_SIZE);

  useEffect(() => {
    micButtonWidthSV.value = micVisible
      ? withSpring(INPUT_BAR_BUTTON_SIZE, {
          duration: 250,
          dampingRatio: 0.65,
        })
      : withTiming(0, { duration: 250 });
  }, [micVisible, micButtonWidthSV]);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    width: micButtonWidthSV.value,
  }));

  return { micAnimatedStyle };
}
