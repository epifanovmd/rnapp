import { useWindowDimensions } from "react-native";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

import { SCALE_FROM, SLIDE_DISTANCE } from "../constants";
import { directionSign, isVerticalDirection } from "../direction";
import { TDialogAnimation, TDialogDirection } from "../types";
import { TDialogAnimationValues } from "./useDialogAnimation";

export interface IDialogAnimatedStylesArgs {
  values: TDialogAnimationValues;
  animationType: TDialogAnimation;
  animationDirection: TDialogDirection;
  swipeDirection: TDialogDirection;
}

/**
 * Производные анимированные стили: прогресс подложки (гаснет при свайпе)
 * и transform/opacity карточки по типу анимации.
 */
export const useDialogAnimatedStyles = ({
  values,
  animationType,
  animationDirection,
  swipeDirection,
}: IDialogAnimatedStylesArgs) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { progress, dragX, dragY, cardWidth, cardHeight } = values;

  const backdropProgress = useDerivedValue(() => {
    const vertical = isVerticalDirection(swipeDirection);
    const drag = vertical ? dragY.value : dragX.value;
    const distance = vertical
      ? cardHeight.value || screenHeight
      : cardWidth.value || screenWidth;
    const dragRatio = Math.min(Math.abs(drag) / distance, 1);

    return progress.value * (1 - dragRatio);
  }, [swipeDirection, screenWidth, screenHeight]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const scale =
      animationType === "scale" || animationType === "scaleSlide"
        ? interpolate(
            progress.value,
            [0, 1],
            [SCALE_FROM, 1],
            Extrapolation.CLAMP,
          )
        : 1;

    let slideX = 0;
    let slideY = 0;

    if (animationType === "slide" || animationType === "scaleSlide") {
      const from = directionSign(animationDirection) * SLIDE_DISTANCE;
      const shift = interpolate(
        progress.value,
        [0, 1],
        [from, 0],
        Extrapolation.CLAMP,
      );

      if (isVerticalDirection(animationDirection)) {
        slideY = shift;
      } else {
        slideX = shift;
      }
    }

    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { scale },
        { translateY: slideY + dragY.value },
        { translateX: slideX + dragX.value },
      ],
    };
  }, [animationType, animationDirection]);

  return { backdropProgress, cardAnimatedStyle };
};
