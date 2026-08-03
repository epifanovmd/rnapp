import { useMemo } from "react";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { IChatLayout } from "../config";
import { IChatStickyDate } from "../model";

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
  layout: IChatLayout,
  enabled: boolean,
): IChatStickyDate => {
  const opacity = useSharedValue(0);

  const showMs = layout.stickyDateShowDuration * 1000;
  const hideMs = layout.stickyDateHideDuration * 1000;
  const hideDelayMs = layout.stickyDateHideDelay * 1000;

  useAnimatedReaction(
    () => scrollOffset.value,
    (current, previous) => {
      if (!enabled || previous === null || current === previous) return;

      opacity.value = withSequence(
        withTiming(1, { duration: showMs }),
        withDelay(hideDelayMs, withTiming(0, { duration: hideMs })),
      );
    },
    [enabled, showMs, hideMs, hideDelayMs],
  );

  return useMemo(() => ({ activeIndex, opacity }), [activeIndex, opacity]);
};
