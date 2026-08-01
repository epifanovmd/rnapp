import { useKeyboardHandler } from "react-native-keyboard-controller";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
 */
export function useKeyboardInset(
  externalInset?: Readonly<ReturnType<typeof useSharedValue<number>>>,
) {
  const safeArea = useSafeAreaInsets();
  const safeAreaBottom = safeArea.bottom;

  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      onStart: e => {
        "worklet";
        keyboardHeight.value = withTiming(e.height, { duration: e.duration });
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
      },
    },
    [],
  );

  const internalInset = useDerivedValue(
    () => Math.max(keyboardHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const bottomInset = externalInset ?? internalInset;

  return { bottomInset, keyboardHeight };
}
