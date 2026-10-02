import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { useKeyboardHeight } from "@shared/lib/keyboard";
import { IContainerKeyboardShift } from "@shared/lib/keyboard-aware";
import { useCallback } from "react";
import { Keyboard } from "react-native";
import { State } from "react-native-gesture-handler";
import {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { computeSheetKeyboardLayout } from "../sheet-keyboard-layout";

/** Сдвиг шторки жестом вниз, после которого клавиатура закрывается, px. */
const DRAG_DISMISS_THRESHOLD = 8;

const dismissKeyboard = () => Keyboard.dismiss();

const isGestureActive = (state: State) => {
  "worklet";

  return state === State.ACTIVE || state === State.BEGAN;
};

/**
 * Шторка над клавиатурой без участия gorhom: покадрово по keyboard-controller
 * считает сдвиг шторки (`keyboardShift` — его применяет контейнер модалки) и
 * нижний отступ раскладки (`paddingStyle`). Позиция gorhom не меняется,
 * поэтому её состояние, блокировки скролла и dynamic sizing о клавиатуре не
 * знают. Перетаскивание шторки при открытой клавиатуре закрывает её: сдвиг
 * считается от позиции на начало жеста.
 *
 * `containerShift` — подъём и ужатие области контента при данной высоте
 * клавиатуры для `useKeyboardAwareScroll` скролла шторки.
 */
export const useSheetKeyboardLayout = (
  safeAreaBottom: number,
  keyboardShift?: SharedValue<number>,
) => {
  const {
    animatedPosition,
    animatedContentGestureState,
    animatedHandleGestureState,
  } = useBottomSheetInternal();
  const { height: keyboardHeight } = useKeyboardHeight();

  // Позиция на начало жеста: сдвиг не должен идти навстречу пальцу.
  const gesturePosition = useSharedValue(-1);
  const dismissRequested = useSharedValue(false);

  const resolve = useCallback(
    (keyboard: number) => {
      "worklet";

      return computeSheetKeyboardLayout({
        keyboardHeight: keyboard,
        restPosition:
          gesturePosition.value >= 0
            ? gesturePosition.value
            : animatedPosition.value,
        safeAreaBottom,
      });
    },
    [animatedPosition, gesturePosition, safeAreaBottom],
  );

  const containerShift = useCallback(
    (keyboard: number): IContainerKeyboardShift => {
      "worklet";
      const layout = resolve(keyboard);

      return {
        lift: -layout.translateY,
        shrink: layout.paddingBottom - safeAreaBottom,
      };
    },
    [resolve, safeAreaBottom],
  );

  const layout = useDerivedValue(() => resolve(keyboardHeight.value));

  useAnimatedReaction(
    () => layout.value.translateY,
    translateY => {
      if (keyboardShift) keyboardShift.value = translateY;
    },
  );

  useAnimatedReaction(
    () =>
      isGestureActive(animatedContentGestureState.value) ||
      isGestureActive(animatedHandleGestureState.value),
    (active, previous) => {
      if (active === previous) return;

      gesturePosition.value = active ? animatedPosition.value : -1;
    },
  );

  useAnimatedReaction(
    () => animatedPosition.value,
    position => {
      if (keyboardHeight.value <= 0) {
        dismissRequested.value = false;

        return;
      }

      if (dismissRequested.value || gesturePosition.value < 0) return;
      if (position - gesturePosition.value < DRAG_DISMISS_THRESHOLD) return;

      dismissRequested.value = true;
      scheduleOnRN(dismissKeyboard);
    },
  );

  const paddingStyle = useAnimatedStyle(() => ({
    paddingBottom: layout.value.paddingBottom,
  }));

  return { paddingStyle, containerShift };
};
