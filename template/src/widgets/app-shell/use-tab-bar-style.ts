import { barProgress } from "@shared/lib/bars";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";

import { useTabBar } from "./tab-bar";

/**
 * Как таб-панель уходит с глаз:
 * slide — уезжает вниз за край экрана;
 * shrink — остаётся на месте и сжимается вместе с иконками и подписями.
 */
export type TTabBarHideMode = "slide" | "shrink";

/** Масштаб панели в сжатом состоянии */
const MIN_SCALE = 0.7;

/**
 * Стиль скрытия таб-панели по её offset. Оба режима читают одно и то же
 * состояние панели — меняется только визуал, поведение при скролле общее.
 */
export const useTabBarStyle = (mode: TTabBarHideMode = "slide") => {
  const { offset, height } = useTabBar();

  return useAnimatedStyle(() => {
    if (mode === "shrink") {
      const progress = barProgress(offset.value, height.value);

      return {
        transform: [
          {
            scale: interpolate(progress, [0, 1], [1, MIN_SCALE]),
          },
          {
            translateY: interpolate(progress, [0, 1], [1, 24]),
          },
        ],
      };
    }

    return { transform: [{ translateY: offset.value }] };
  }, [mode]);
};
