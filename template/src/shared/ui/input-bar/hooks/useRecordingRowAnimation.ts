import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useInputBarContext } from "../config";

/** Амплитуда покачивания подсказки «Отмена» (порт animateSlide). */
const SLIDE_HINT_SHIFT = 8;

/**
 * Анимации строки записи: мигающая точка + покачивание подсказки «Отмена».
 */
export function useRecordingRowAnimation() {
  const { layout } = useInputBarContext();

  const dotAlpha = useSharedValue(1);
  const slideShift = useSharedValue(0);

  useEffect(() => {
    dotAlpha.value = withRepeat(
      withTiming(layout.recordDotMinAlpha, { duration: 500 }),
      -1,
      true,
    );
    // Порт animateSlide: под качает подсказку между -8 и +8 (первый проход
    // идёт от нуля), поэтому амплитуда 16, а не 8.
    slideShift.value = SLIDE_HINT_SHIFT;
    slideShift.value = withRepeat(
      withTiming(-SLIDE_HINT_SHIFT, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(dotAlpha);
      cancelAnimation(slideShift);
    };
  }, [dotAlpha, slideShift, layout.recordDotMinAlpha]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotAlpha.value }));

  return { dotStyle, slideShift };
}
