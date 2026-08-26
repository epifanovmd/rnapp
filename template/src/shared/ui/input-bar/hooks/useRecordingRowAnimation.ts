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

/** Амплитуда покачивания подсказки «Отмена». */
const SLIDE_HINT_SHIFT = 8;

/** До какой прозрачности гаснет мигающая точка записи. */
const DOT_MIN_ALPHA = 0.2;

/**
 * Анимации строки записи: мигающая точка + покачивание подсказки «Отмена».
 */
export function useRecordingRowAnimation() {
  const dotAlpha = useSharedValue(1);
  const slideShift = useSharedValue(0);

  useEffect(() => {
    dotAlpha.value = withRepeat(
      withTiming(DOT_MIN_ALPHA, { duration: 500 }),
      -1,
      true,
    );
    // Подсказка качается между -8 и +8 (первый проход
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
  }, [dotAlpha, slideShift]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotAlpha.value }));

  return { dotStyle, slideShift };
}
