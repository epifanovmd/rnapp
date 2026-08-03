import { useEffect, useRef } from "react";
import { ViewStyle } from "react-native";
import {
  AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/** Половина перехода: столько гаснет и столько же проявляется. */
const DEFAULT_HALF_DURATION_MS = 125;

/**
 * Стиль, гасящий и проявляющий контент при смене `dependency`.
 *
 * Первый рендер проходит без анимации: появление содержимого — не смена.
 */
export const useCrossfade = (
  dependency: unknown,
  halfDurationMs = DEFAULT_HALF_DURATION_MS,
): AnimatedStyle<ViewStyle> => {
  const opacity = useSharedValue(1);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;

      return;
    }

    opacity.value = withSequence(
      withTiming(0, { duration: halfDurationMs }),
      withTiming(1, { duration: halfDurationMs }),
    );
  }, [dependency, opacity, halfDurationMs]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};
