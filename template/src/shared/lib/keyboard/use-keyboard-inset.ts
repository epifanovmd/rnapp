import { useCallback, useMemo } from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFreezableValue } from "../hooks/use-freezable-value";
import { useKeyboardHeight } from "./use-keyboard-height";

export interface IKeyboardInsetOptions {
  barHeight: SharedValue<number>;
  extraPadding?: number;
  onBlur?: () => void;
  onRefocus?: () => void;
}

export interface IKeyboardInset {
  /** Перекрытие снизу клавиатурой или safe area. */
  occludedBottom: SharedValue<number>;
  /** Полное перекрытие: зона + панель + отступы. */
  contentInset: SharedValue<number>;
  /** Целевое перекрытие — известно до начала анимации. */
  reservedInset: SharedValue<number>;

  isFrozen: SharedValue<boolean>;
  freeze: () => void;
  restore: () => void;

  isKeyboardVisible: () => boolean;
  getContentInset: () => number;
}

/**
 * Единственная подписка на клавиатуру на экран. Отсюда зону получают панель
 * ввода, скролл, FAB и оверлеи. Заморозка держит только отступ контента.
 */
export const useKeyboardInset = ({
  barHeight,
  extraPadding = 0,
  onBlur,
  onRefocus,
}: IKeyboardInsetOptions): IKeyboardInset => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();

  const occludedBottom = useDerivedValue(
    () => Math.max(keyboard.height.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const occludedBottomTarget = useDerivedValue(
    () => Math.max(keyboard.targetHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const liveInset = useDerivedValue(
    () => occludedBottom.value + barHeight.value + extraPadding,
    [extraPadding],
  );

  const liveReserved = useDerivedValue(
    () => occludedBottomTarget.value + barHeight.value + extraPadding,
    [extraPadding],
  );

  const {
    value: contentInset,
    frozen,
    isFrozen,
    freeze,
    restore,
  } = useFreezableValue({
    live: liveInset,
    isSourceActive: keyboard.isVisible,
    onFreeze: onBlur,
    onRestore: onRefocus,
  });

  const reservedInset = useDerivedValue(() =>
    frozen.value >= 0 ? frozen.value : liveReserved.value,
  );

  const getContentInset = useCallback(
    () =>
      Math.max(keyboard.getHeight(), safeAreaBottom) +
      barHeight.value +
      extraPadding,
    [keyboard, safeAreaBottom, barHeight, extraPadding],
  );

  return useMemo(
    () => ({
      occludedBottom,
      contentInset,
      reservedInset,
      isFrozen,
      freeze,
      restore,
      isKeyboardVisible: keyboard.isVisible,
      getContentInset,
    }),
    [
      occludedBottom,
      contentInset,
      reservedInset,
      isFrozen,
      freeze,
      restore,
      keyboard.isVisible,
      getContentInset,
    ],
  );
};
