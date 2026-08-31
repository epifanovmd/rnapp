import { LayoutChangeEvent } from "react-native";
import { makeMutable, withTiming } from "react-native-reanimated";

import { clampOffset, snapOffset } from "./bar-visibility";
import { IBar } from "./bars.types";

export interface IBarOptions {
  /** Длительность show/hide/snap, мс */
  duration?: number;
}

const DEFAULT_DURATION = 250;

/**
 * Панель вне React: shared values создаются через makeMutable, поэтому реестр
 * заводит панель по требованию, а не хуком в фиксированном провайдере.
 *
 * Пока высота не измерена (0), hide/snap/shift — no-op: панель нельзя
 * спрятать на неизвестную величину.
 */
export const createBar = (options: IBarOptions = {}): IBar => {
  const { duration = DEFAULT_DURATION } = options;
  const height = makeMutable(0);
  const offset = makeMutable(0);
  const listeners = new Set<() => void>();
  let measured = 0;

  const show = () => {
    "worklet";
    offset.value = withTiming(0, { duration });
  };

  const hide = () => {
    "worklet";
    if (height.value > 0) {
      offset.value = withTiming(height.value, { duration });
    }
  };

  const snap = () => {
    "worklet";
    if (height.value > 0) {
      offset.value = withTiming(snapOffset(offset.value, height.value), {
        duration,
      });
    }
  };

  const shift = (delta: number) => {
    "worklet";
    if (height.value > 0) {
      offset.value = clampOffset(offset.value + delta, height.value);
    }
  };

  const setHeight = (next: number) => {
    if (next === measured) {
      return;
    }

    measured = next;
    height.value = next;
    offset.value = clampOffset(offset.value, next);
    listeners.forEach(listener => listener());
  };

  return {
    height,
    offset,
    show,
    hide,
    snap,
    shift,
    setHeight,
    onLayout: (event: LayoutChangeEvent) =>
      setHeight(event.nativeEvent.layout.height),
    getHeight: () => measured,
    subscribeHeight: listener => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
