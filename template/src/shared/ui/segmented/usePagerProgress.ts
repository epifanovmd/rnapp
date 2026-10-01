import { useEffect } from "react";
import { Animated } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

/** Зеркалит RN `Animated`-позицию пейджера в shared value для Reanimated. */
export const usePagerProgress = (
  position: Animated.AnimatedInterpolation<number>,
  initialIndex: number,
): SharedValue<number> => {
  const progress = useSharedValue(initialIndex);

  useEffect(() => {
    const id = position.addListener(({ value }) => {
      progress.value = value;
    });

    return () => position.removeListener(id);
  }, [position, progress]);

  return progress;
};
