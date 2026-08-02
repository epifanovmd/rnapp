import { useEffect } from "react";
import {
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Анимации перехода mic↔send при вводе текста.
 * Оба направления — spring, чтобы исчезновение и появление шли
 * параллельно и плавно.
 */
export function useMicSendAnimation(
  showMic: boolean,
  showInternalSend: boolean,
) {
  const micScale = useSharedValue(showMic ? 1 : 0.01);
  const micAlpha = useSharedValue(showMic ? 1 : 0);
  const sendScale = useSharedValue(showInternalSend ? 1 : 0.01);
  const sendAlpha = useSharedValue(showInternalSend ? 1 : 0);

  useEffect(() => {
    if (showMic) {
      micScale.value = withDelay(
        50,
        withSpring(1, { duration: 250, dampingRatio: 0.65 }),
      );
      micAlpha.value = withDelay(50, withTiming(1, { duration: 250 }));
    } else {
      // Микрофон уходит spring-ом, параллельно с появлением send.
      micScale.value = withSpring(0.01, {
        duration: 250,
        dampingRatio: 0.7,
      });
      micAlpha.value = withTiming(0, { duration: 200 });
    }
  }, [showMic, micScale, micAlpha]);

  useEffect(() => {
    if (showInternalSend) {
      // Без задержки — появляется параллельно с уходом микрофона.
      sendScale.value = withSpring(1, {
        duration: 250,
        dampingRatio: 0.7,
      });
      sendAlpha.value = withTiming(1, { duration: 200 });
    } else {
      sendScale.value = withSpring(0.01, {
        duration: 200,
        dampingRatio: 0.7,
      });
      sendAlpha.value = withTiming(0, { duration: 150 });
    }
  }, [showInternalSend, sendScale, sendAlpha]);

  return { micScale, micAlpha, sendScale, sendAlpha };
}
