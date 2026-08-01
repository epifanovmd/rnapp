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

import { useInputBarContext } from "../model/input-bar-context";

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
    slideShift.value = withRepeat(
      withTiming(-8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
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
