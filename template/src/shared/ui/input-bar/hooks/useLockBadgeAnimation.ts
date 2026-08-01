import { useEffect } from "react";
import {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Анимация появления/скрытия бейджа блокировки записи.
 */
export function useLockBadgeAnimation(
  visible: boolean,
  scale: SharedValue<number>,
) {
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      badgeOpacity.value = withDelay(
        80,
        withSpring(1, { duration: 220, dampingRatio: 0.65 }),
      );
      badgeScale.value = withDelay(
        80,
        withSpring(1, { duration: 220, dampingRatio: 0.65 }),
      );
    } else {
      badgeOpacity.value = withTiming(0, { duration: 150 });
      badgeScale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible, badgeOpacity, badgeScale]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value * scale.value }],
  }));

  return { badgeStyle };
}
