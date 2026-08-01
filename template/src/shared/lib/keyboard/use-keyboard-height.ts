import { useCallback, useRef } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Сырая высота клавиатуры — единственный низкоуровневый источник правды.
 *
 * SRP: хук не знает ни про safe area, ни про панели ввода, ни про списки.
 * Он только отражает положение клавиатуры покадрово на UI-потоке, включая
 * интерактивное закрытие свайпом (`onInteractive`).
 *
 * `onStart` задаёт целевую высоту через `withTiming` с длительностью самой
 * клавиатуры — это страховка на случай, если покадровых `onMove` не будет
 * (часть Android-конфигураций). Любой пришедший `onMove` просто перебьёт
 * анимацию присваиванием, поэтому двойного источника движения не возникает.
 */
export interface IKeyboardHeight {
  /** Текущая высота клавиатуры (0 — скрыта). Обновляется на UI-потоке. */
  height: SharedValue<number>;
  /**
   * Высота, к которой клавиатура едет прямо сейчас (известна из `onStart`
   * до начала анимации). Нужна тем, кто должен подготовить место заранее —
   * например зарезервировать диапазон скролла, чтобы позицию не подрезало
   * ещё не выросшим `contentSize`.
   */
  targetHeight: SharedValue<number>;
  /**
   * Открыта ли клавиатура — синхронное чтение из JS. Читать `height.value`
   * из JS-обработчика нельзя: он живёт на другом потоке.
   */
  isVisible: () => boolean;
}

export const useKeyboardHeight = (): IKeyboardHeight => {
  const height = useSharedValue(0);
  const targetHeight = useSharedValue(0);
  const isVisibleRef = useRef(false);

  const setVisible = useCallback((visible: boolean) => {
    isVisibleRef.current = visible;
  }, []);

  useKeyboardHandler(
    {
      onStart: e => {
        "worklet";
        // Цель известна до анимации — сообщаем её первой, чтобы потребители
        // успели подготовить место к первому же кадру движения.
        targetHeight.value = e.height;
        height.value = withTiming(e.height, { duration: e.duration });
        scheduleOnRN(setVisible, e.height > 0);
      },
      onMove: e => {
        "worklet";
        height.value = e.height;
      },
      onInteractive: e => {
        "worklet";
        // У жеста цели нет: пользователь в любой момент может остановиться
        // или повести обратно, поэтому цель — это текущее положение.
        targetHeight.value = e.height;
        height.value = e.height;
      },
      onEnd: e => {
        "worklet";
        targetHeight.value = e.height;
        height.value = e.height;
        scheduleOnRN(setVisible, e.height > 0);
      },
    },
    [setVisible],
  );

  const isVisible = useCallback(() => isVisibleRef.current, []);

  return { height, targetHeight, isVisible };
};
