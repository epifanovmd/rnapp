import { useEffect } from "react";
import {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** Насколько ниже своего места стартует капсула замка. */
const BADGE_ENTER_SHIFT = 20;

/**
 * Анимация появления/скрытия бейджа блокировки записи.
 */
export function useLockBadgeAnimation(
  visible: boolean,
  scale: SharedValue<number>,
) {
  const badgeOpacity = useSharedValue(0);
  const badgeShift = useSharedValue(BADGE_ENTER_SHIFT);

  // Капсула выезжает снизу (translateY 20 → 0)
  // пружиной с задержкой 0.1 с, а уходит просто по прозрачности.
  useEffect(() => {
    if (visible) {
      badgeOpacity.value = withDelay(
        100,
        withSpring(1, { duration: 300, dampingRatio: 0.7 }),
      );
      badgeShift.value = withDelay(
        100,
        withSpring(0, { duration: 300, dampingRatio: 0.7 }),
      );
    } else {
      badgeOpacity.value = withTiming(0, { duration: 200 });
      badgeShift.value = BADGE_ENTER_SHIFT;
    }
  }, [visible, badgeOpacity, badgeShift]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ translateY: badgeShift.value }, { scale: scale.value }],
  }));

  return { badgeStyle };
}
