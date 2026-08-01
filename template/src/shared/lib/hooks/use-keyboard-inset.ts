import { useCallback, useRef } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Общий хук отслеживания клавиатуры — используется и в чате, и на демо-странице.
 *
 * - `useKeyboardHandler` даёт покадровые координаты клавиатуры на UI-потоке,
 *   `onStart` приходит с destination-значениями (высота + длительность),
 *   поэтому анимация отступа стартует синхронно с клавиатурой.
 * - `bottomInset = max(keyboardHeight, safeAreaBottom)` — когда клавиатура
 *   скрыта, панель/отступ всё равно держатся над home indicator.
 * - Если передан `externalInset`, используется он вместо внутреннего
 *   расчёта — чату это позволяет делать freeze/thaw при контекстном меню.
 * - `keyboardHeightRef` — та же высота, но на JS-потоке: обновляется только на
 *   старте и в конце анимации (не покадрово), поэтому её можно читать в
 *   обычных расчётах (расстояние до конца списка) без ре-рендеров.
 */
export function useKeyboardInset(
  externalInset?: Readonly<ReturnType<typeof useSharedValue<number>>>,
) {
  const safeArea = useSafeAreaInsets();
  const safeAreaBottom = safeArea.bottom;

  const keyboardHeight = useSharedValue(0);
  const keyboardHeightRef = useRef(0);

  const syncKeyboardHeight = useCallback((height: number) => {
    keyboardHeightRef.current = height;
  }, []);

  useKeyboardHandler(
    {
      onStart: e => {
        "worklet";
        keyboardHeight.value = withTiming(e.height, { duration: e.duration });
        scheduleOnRN(syncKeyboardHeight, e.height);
      },
      onMove: e => {
        "worklet";
        keyboardHeight.value = e.height;
      },
      onInteractive: e => {
        "worklet";
        keyboardHeight.value = e.height;
      },
      onEnd: e => {
        "worklet";
        keyboardHeight.value = e.height;
        scheduleOnRN(syncKeyboardHeight, e.height);
      },
    },
    [syncKeyboardHeight],
  );

  const internalInset = useDerivedValue(
    () => Math.max(keyboardHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const bottomInset = externalInset ?? internalInset;

  return { bottomInset, keyboardHeight, keyboardHeightRef };
}
