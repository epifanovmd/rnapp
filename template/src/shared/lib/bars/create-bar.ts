import { LayoutChangeEvent } from "react-native";
import { makeMutable, runOnUI, withTiming } from "react-native-reanimated";

import {
  clampOffset,
  isRemeasure,
  rebaseOffset,
  resolveCollapseRange,
  snapOffset,
} from "./bar-visibility";
import { IBar } from "./bars.types";

export interface IBarOptions {
  /** Длительность show/hide/snap и анимации отступа контента, мс */
  duration?: number;
}

const DEFAULT_DURATION = 250;

/**
 * Панель вне React: shared values создаются через makeMutable, поэтому реестр
 * заводит панель по требованию, а не хуком в фиксированном провайдере.
 *
 * Пока высота не измерена (0), hide/snap/shift — no-op: панель нельзя
 * спрятать на неизвестную величину. Смена высоты или закреплённой части
 * перебазирует offset на UI-потоке вместе с самой величиной — в одном кадре.
 */
export const createBar = (options: IBarOptions = {}): IBar => {
  const { duration = DEFAULT_DURATION } = options;
  const height = makeMutable(0);
  const pinned = makeMutable(0);
  const inset = makeMutable(0);
  const offset = makeMutable(0);
  const listeners = new Set<() => void>();
  let measured = 0;
  let measuredPinned = 0;

  const range = () => {
    "worklet";

    return resolveCollapseRange(height.value, pinned.value);
  };

  const show = () => {
    "worklet";
    offset.value = withTiming(0, { duration });
  };

  const hide = () => {
    "worklet";
    if (height.value > 0) {
      offset.value = withTiming(range(), { duration });
    }
  };

  const snap = () => {
    "worklet";
    if (height.value > 0) {
      offset.value = withTiming(snapOffset(offset.value, range()), {
        duration,
      });
    }
  };

  const shift = (delta: number) => {
    "worklet";
    if (height.value > 0) {
      offset.value = clampOffset(offset.value + delta, range());
    }
  };

  const remeasure = (nextHeight: number, nextPinned: number) => {
    "worklet";
    const prevHeight = height.value;
    const prevRange = range();

    height.value = nextHeight;
    pinned.value = nextPinned;
    offset.value = rebaseOffset(
      offset.value,
      prevRange,
      resolveCollapseRange(nextHeight, nextPinned),
    );
    inset.value = isRemeasure(prevHeight, nextHeight)
      ? withTiming(nextHeight, { duration })
      : nextHeight;
  };

  const setHeight = (next: number) => {
    if (next === measured) {
      return;
    }

    measured = next;
    runOnUI(remeasure)(next, measuredPinned);
    listeners.forEach(listener => listener());
  };

  const setPinnedHeight = (next: number) => {
    if (next === measuredPinned) {
      return;
    }

    measuredPinned = next;
    runOnUI(remeasure)(measured, next);
  };

  return {
    height,
    pinned,
    inset,
    offset,
    show,
    hide,
    snap,
    shift,
    setHeight,
    setPinnedHeight,
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
