import { useMemo } from "react";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { IChatStickyDate } from "../model";

/** Проявление, пауза и угасание плашки (мс). */
const SHOW_MS = 150;
const HIDE_MS = 300;
const HIDE_DELAY_MS = 500;

/**
 * Автоскрытие прилипшей плашки даты — целиком на UI-потоке.
 *
 * Прилипанием занимается сам список; здесь только «проявить → подождать →
 * погасить» на каждое движение. Перезапуск отменяет предыдущую анимацию,
 * поэтому пауза каждый раз начинает идти заново.
 */
export const useChatStickyDate = (
  scrollOffset: SharedValue<number>,
  activeIndex: SharedValue<number>,
): IChatStickyDate => {
  const opacity = useSharedValue(0);

  useAnimatedReaction(
    () => scrollOffset.value,
    (current, previous) => {
      if (previous === null || current === previous) return;

      opacity.value = withSequence(
        withTiming(1, { duration: SHOW_MS }),
        withDelay(HIDE_DELAY_MS, withTiming(0, { duration: HIDE_MS })),
      );
    },
    [],
  );

  return useMemo(() => ({ activeIndex, opacity }), [activeIndex, opacity]);
};
