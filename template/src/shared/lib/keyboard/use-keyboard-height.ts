import { useCallback, useRef } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Сырая высота клавиатуры — низкоуровневый источник правды: покадрово на
 * UI-потоке, включая интерактивное закрытие свайпом. О safe area и панелях
 * не знает.
 */

export interface IKeyboardHeight {
  /** Текущая высота (0 — скрыта). UI-поток. */
  height: SharedValue<number>;
  /** Высота, к которой едем — известна из `onStart`, до начала анимации. */
  targetHeight: SharedValue<number>;
  /** Синхронное чтение из JS: открыта ли клавиатура. */
  isVisible: () => boolean;
  /** Синхронное чтение из JS: текущая высота. */
  getHeight: () => number;
}

export const useKeyboardHeight = (): IKeyboardHeight => {
  const height = useSharedValue(0);
  const targetHeight = useSharedValue(0);

  const isVisibleRef = useRef(false);
  const heightRef = useRef(0);

  const setVisible = useCallback((visible: boolean) => {
    isVisibleRef.current = visible;
  }, []);

  const setHeight = useCallback((h: number) => {
    heightRef.current = h;
  }, []);

  useKeyboardHandler(
    {
      onStart: e => {
        "worklet";
        targetHeight.value = e.height;
        height.value = withTiming(e.height, { duration: e.duration });
        scheduleOnRN(setVisible, e.height > 0);
        scheduleOnRN(setHeight, e.height);
      },
      onMove: e => {
        "worklet";
        height.value = e.height;
      },
      onInteractive: e => {
        "worklet";
        targetHeight.value = e.height;
        height.value = e.height;
        scheduleOnRN(setHeight, e.height);
      },
      onEnd: e => {
        "worklet";
        targetHeight.value = e.height;
        height.value = e.height;
        scheduleOnRN(setVisible, e.height > 0);
        scheduleOnRN(setHeight, e.height);
      },
    },
    [setVisible, setHeight],
  );

  const isVisible = useCallback(() => isVisibleRef.current, []);
  const getHeight = useCallback(() => heightRef.current, []);

  return { height, targetHeight, isVisible, getHeight };
};
