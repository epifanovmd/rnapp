import { useState } from "react";
import { DerivedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/** Мост UI → JS: индекс активной точки первой серии (`-1`, если касания нет). */
export const useJsActiveIndex = (activeIndices: DerivedValue<number[]>) => {
  const [activeIndex, setActiveIndex] = useState(
    () => activeIndices.value[0] ?? -1,
  );

  useAnimatedReaction(
    () => activeIndices.value[0] ?? -1,
    (next, previous) => {
      if (next !== previous) {
        scheduleOnRN(setActiveIndex, next);
      }
    },
    [activeIndices],
  );

  return activeIndex;
};
