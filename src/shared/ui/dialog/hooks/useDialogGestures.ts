import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CLOSE_VELOCITY, DRAG_TOSS, RESISTANCE } from "../constants";
import { directionSign, isVerticalDirection } from "../direction";
import { TDialogDirection } from "../types";
import { TDialogAnimationValues } from "./useDialogAnimation";

export interface IDialogGesturesArgs {
  values: TDialogAnimationValues;
  enableBackdropClose: boolean;
  enableSwipeClose: boolean;
  swipeDirection: TDialogDirection;
  swipeThreshold: number;
  duration: number;
  /** Стабильный колбэк запроса закрытия. */
  requestClose: () => void;
}

/**
 * Жесты диалога: тап по подложке и свайп карточки с демпфированием
 * против направления закрытия.
 */
export const useDialogGestures = ({
  values,
  enableBackdropClose,
  enableSwipeClose,
  swipeDirection,
  swipeThreshold,
  duration,
  requestClose,
}: IDialogGesturesArgs) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { dragX, dragY, cardWidth, cardHeight } = values;

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(enableBackdropClose)
        .onEnd(() => {
          "worklet";
          scheduleOnRN(requestClose);
        }),
    [enableBackdropClose, requestClose],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enableSwipeClose)
        .onUpdate(event => {
          "worklet";
          const sign = directionSign(swipeDirection);

          if (isVerticalDirection(swipeDirection)) {
            const forward = event.translationY * sign > 0;

            dragY.value = forward
              ? event.translationY
              : event.translationY * RESISTANCE;
            dragX.value = 0;
          } else {
            const forward = event.translationX * sign > 0;

            dragX.value = forward
              ? event.translationX
              : event.translationX * RESISTANCE;
            dragY.value = 0;
          }
        })
        .onEnd(event => {
          "worklet";
          const sign = directionSign(swipeDirection);
          const vertical = isVerticalDirection(swipeDirection);
          const translation = vertical
            ? event.translationY
            : event.translationX;
          const velocity = vertical ? event.velocityY : event.velocityX;
          const distance = vertical
            ? cardHeight.value || screenHeight
            : cardWidth.value || screenWidth;
          const endOffset = (translation + velocity * DRAG_TOSS) * sign;

          if (
            endOffset > distance * swipeThreshold ||
            velocity * sign > CLOSE_VELOCITY
          ) {
            scheduleOnRN(requestClose);
          } else {
            dragX.value = withTiming(0, { duration });
            dragY.value = withTiming(0, { duration });
          }
        }),
    [
      enableSwipeClose,
      swipeDirection,
      swipeThreshold,
      duration,
      screenWidth,
      screenHeight,
      dragX,
      dragY,
      cardWidth,
      cardHeight,
      requestClose,
    ],
  );

  return { tapGesture, panGesture };
};
