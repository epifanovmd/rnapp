import { useKeyboardHandler } from "react-native-keyboard-controller";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Единый источник правды о нижней границе экрана.
 *
 * -- `overlay` = `max(keyboardHeight, safeAreaBottom)`. Это то, что должен
 *    использовать любой потребитель: панель ввода, FAB, компенсация скролла.
 *    Когда клавиатура скрыта, здесь safe area; когда открыта — высота
 *    клавиатуры. Конкретная арифметика — забота хука, а не его потребителя.
 *
 * -- `keyboardHeight` — сырая высота клавиатуры (0 когда скрыта). Нужна
 *    только для продвинутых сценариев: freeze/thaw панели ввода (понять,
 *    была ли клавиатура открыта до заморозки и до какой высоты возвращать).
 *
 * Если передан `frozenOverlay`, используется он вместо внутреннего расчёта.
 * Это даёт чату заморозить зону при открытии контекстного меню: достаточно
 * заменить живое значение на замороженное — бар, FAB и скролл замрут разом.
 */
export function useKeyboardOverlay(
  frozenOverlay?: Readonly<ReturnType<typeof useSharedValue<number>>>,
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

  const internalOverlay = useDerivedValue(
    () => Math.max(keyboardHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const overlay = frozenOverlay ?? internalOverlay;

  return { overlay, keyboardHeight };
}
