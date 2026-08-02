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
 * Прилипшая плашка даты — целиком на UI-потоке.
 *
 * Прилипанием и выталкиванием следующим разделителем занимается сам список
 * (`stickyHeaderIndices`), а сюда остаётся только автоскрытие в покое.
 *
 * Ни таймера, ни подписки в JS: реакция на `scrollOffset` живёт на UI-потоке и
 * на каждом кадре перезапускает одну и ту же последовательность «проявить →
 * подождать → погасить». Перезапуск отменяет предыдущую анимацию, поэтому пауза
 * начинает идти заново — плашка гаснет ровно через `stickyDateHideDelay` после
 * последнего движения.
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
