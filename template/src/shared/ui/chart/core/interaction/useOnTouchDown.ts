import { SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export const useOnTouchDown = (
  touchX: SharedValue<number>,
  touchY: SharedValue<number>,
  isActive: SharedValue<boolean>,
  onTouchDown: (x: number, y: number) => void,
) => {
  useAnimatedReaction(
    () => isActive.value,
    (next, previous) => {
      if (next && !previous) {
        scheduleOnRN(onTouchDown, touchX.value, touchY.value);
      }
    },
    [touchX, touchY, isActive, onTouchDown],
  );
};
