import { IScrollTelemetry } from "@shared/lib/scroll";
import {
  clamp,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";

import { IBarHandle, TBarSyncMode } from "../transition.types";
import { useTransition } from "./use-transition";

export interface IBarScrollSyncConfig {
  mode?: TBarSyncMode;
  /** Накопленная дистанция скролла для переключения в режиме toggle, px */
  toggleThreshold?: number;
  /** follow: доводить до ближайшего состояния после окончания скролла */
  snapOnRelease?: boolean;
}

/** Максимальный сдвиг за один scroll-тик в режиме follow */
const MAX_FOLLOW_DELTA = 3;
const DEFAULT_TOGGLE_THRESHOLD = 12;

/**
 * Привязка бара к телеметрии скролла:
 * follow — offset следует за скроллом попиксельно, со снапом на отпускании;
 * toggle — бар прячется/показывается после накопления toggleThreshold
 * в одну сторону (защита от дребезга на микродвижениях).
 * Overscroll: сверху — показать, снизу — спрятать.
 */
export const useBarScrollSync = (
  telemetry: IScrollTelemetry,
  bar: IBarHandle,
  config: IBarScrollSyncConfig = {},
) => {
  const {
    mode = "follow",
    toggleThreshold = DEFAULT_TOGGLE_THRESHOLD,
    snapOnRelease = true,
  } = config;

  const accumulated = useSharedValue(0);

  useAnimatedReaction(
    () => telemetry.offsetY.value,
    (y, prevY) => {
      if (prevY === null || y === prevY) {
        return;
      }

      if (telemetry.overscrollTop.value > 0) {
        accumulated.value = 0;
        bar.show();

        return;
      }

      if (telemetry.overscrollBottom.value > 0) {
        accumulated.value = 0;
        bar.hide();

        return;
      }

      if (y <= 0) {
        bar.show();

        return;
      }

      const delta = y - prevY;

      if (mode === "follow") {
        bar.shift(clamp(delta, -MAX_FOLLOW_DELTA, MAX_FOLLOW_DELTA));

        return;
      }

      // toggle: копим дистанцию в одну сторону, сбрасываем при смене направления
      const sameDirection = accumulated.value * delta >= 0;

      accumulated.value = sameDirection ? accumulated.value + delta : delta;

      if (accumulated.value > toggleThreshold) {
        bar.hide();
      } else if (accumulated.value < -toggleThreshold) {
        bar.show();
      }
    },
    [bar, mode, toggleThreshold, telemetry],
  );

  useAnimatedReaction(
    () => telemetry.isDragging.value || telemetry.isMomentum.value,
    (active, prevActive) => {
      if (mode === "follow" && snapOnRelease && prevActive && !active) {
        bar.snap();
      }
    },
    [bar, mode, snapOnRelease, telemetry],
  );
};

/**
 * Стандартная связка экрана с барами приложения:
 * navbar — follow, tabbar — toggle.
 */
export const useBarsScrollSync = (telemetry: IScrollTelemetry) => {
  const { navbar, tabBar } = useTransition();

  useBarScrollSync(telemetry, navbar, { mode: "follow" });
  useBarScrollSync(telemetry, tabBar, { mode: "toggle" });
};
