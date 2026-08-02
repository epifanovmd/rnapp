import { useEffect } from "react";
import {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useInputBarContext } from "../config";

/**
 * Анимация ширины правой кнопки (mic).
 * Когда micVisible=false, ширина уходит в 0 — бар плавно расширяется вправо.
 * Скрытие правой кнопки и пересчёт layout входного стека.
 */
export function useRightButtonAnimation(micVisible: boolean) {
  const { layout } = useInputBarContext();

  const micButtonWidthSV = useSharedValue(layout.inputButtonSize);

  useEffect(() => {
    micButtonWidthSV.value = micVisible
      ? withSpring(layout.inputButtonSize, {
          duration: 250,
          dampingRatio: 0.65,
        })
      : withTiming(0, { duration: 250 });
  }, [micVisible, micButtonWidthSV, layout.inputButtonSize]);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    width: micButtonWidthSV.value,
  }));

  return { micAnimatedStyle };
}
