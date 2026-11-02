import { useCallback } from "react";
import { trigger } from "react-native-haptic-feedback";
import { scheduleOnRN } from "react-native-worklets";

import {
  IPullToRefreshConfig,
  TPullToRefreshState,
} from "./pull-to-refresh.types";

const triggerHaptic = () => trigger("impactMedium");

/**
 * Worklet onStateChange с хаптикой срабатывания: armed (release-режим) или
 * запуск из протяжки (threshold-режим); программный refresh() не вибрирует.
 * Внешний onStateChange вызывается следом.
 */
export const usePullToRefreshHaptics = (
  haptics: boolean,
  onStateChange?: IPullToRefreshConfig["onStateChange"],
) =>
  useCallback(
    (prev: TPullToRefreshState, next: TPullToRefreshState) => {
      "worklet";
      if (
        haptics &&
        (next === "armed" || (next === "refreshing" && prev === "pulling"))
      ) {
        scheduleOnRN(triggerHaptic);
      }
      onStateChange?.(prev, next);
    },
    [haptics, onStateChange],
  );
