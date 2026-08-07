import { useLatestRef } from "@shared/lib/hooks";
import { useCallback, useEffect, useState } from "react";
import { Keyboard, LayoutChangeEvent, useWindowDimensions } from "react-native";
import haptic from "react-native-haptic-feedback";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { isVerticalDirection } from "../direction";
import { TDialogDirection } from "../types";

export interface IDialogAnimationArgs {
  isVisible: boolean;
  duration: number;
  swipeDirection: TDialogDirection;
  hapticEnabled: boolean;
  onOpened?: () => void;
  onClosed?: () => void;
}

/**
 * Жизненный цикл диалога: монтирование на время анимаций, прогресс
 * открытия, значения свайпа и замер карточки.
 */
export const useDialogAnimation = ({
  isVisible,
  duration,
  swipeDirection,
  hapticEnabled,
  onOpened,
  onClosed,
}: IDialogAnimationArgs) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Диалог остаётся смонтированным на время анимации закрытия.
  const [mounted, setMounted] = useState(false);

  const progress = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const cardWidth = useSharedValue(0);
  const cardHeight = useSharedValue(0);

  const onOpenedRef = useLatestRef(onOpened);
  const onClosedRef = useLatestRef(onClosed);

  const finishOpen = useCallback(() => {
    onOpenedRef.current?.();
  }, [onOpenedRef]);

  const finishClose = useCallback(() => {
    setMounted(false);
    onClosedRef.current?.();
  }, [onClosedRef]);

  useEffect(() => {
    if (isVisible) {
      Keyboard.dismiss();
      setMounted(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (isVisible) {
      dragX.value = 0;
      dragY.value = 0;

      if (hapticEnabled) {
        haptic.trigger();
      }

      progress.value = withTiming(1, { duration }, finished => {
        if (finished) {
          scheduleOnRN(finishOpen);
        }
      });
    } else {
      // Смахнутая карточка улетает за экран, а не возвращается на место.
      if (isVerticalDirection(swipeDirection) && Math.abs(dragY.value) > 1) {
        const distance = cardHeight.value || screenHeight;

        dragY.value = withTiming(Math.sign(dragY.value) * distance, {
          duration,
        });
      } else if (Math.abs(dragX.value) > 1) {
        const distance = cardWidth.value || screenWidth;

        dragX.value = withTiming(Math.sign(dragX.value) * distance, {
          duration,
        });
      }

      progress.value = withTiming(0, { duration }, finished => {
        if (finished) {
          scheduleOnRN(finishClose);
        }
      });
    }
  }, [
    mounted,
    isVisible,
    duration,
    hapticEnabled,
    swipeDirection,
    screenWidth,
    screenHeight,
    progress,
    dragX,
    dragY,
    cardWidth,
    cardHeight,
    finishOpen,
    finishClose,
  ]);

  const measureCard = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      cardWidth.value = layout.width;
      cardHeight.value = layout.height;
    },
    [cardWidth, cardHeight],
  );

  return {
    mounted,
    progress,
    dragX,
    dragY,
    cardWidth,
    cardHeight,
    measureCard,
  };
};

export type TDialogAnimationValues = Pick<
  ReturnType<typeof useDialogAnimation>,
  "progress" | "dragX" | "dragY" | "cardWidth" | "cardHeight"
>;
