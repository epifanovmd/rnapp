import { useCallback, useMemo, useRef } from "react";
import {
  runOnUI,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  IPullToRefreshConfig,
  IPullToRefreshController,
  TPullToRefreshState,
} from "./pull-to-refresh.types";

export const PULL_TO_REFRESH_DEFAULTS = {
  threshold: 80,
  maxDistanceFactor: 1.5,
  minRefreshDuration: 300,
  settleDuration: 250,
};

/** Дефолтный maxDistance от конфига — общий для контроллера и адаптеров. */
export const resolveMaxPullDistance = (
  config: Pick<IPullToRefreshConfig, "threshold" | "maxDistance">,
): number =>
  config.maxDistance ??
  (config.threshold ?? PULL_TO_REFRESH_DEFAULTS.threshold) *
    PULL_TO_REFRESH_DEFAULTS.maxDistanceFactor;

/**
 * Ядро pull-to-refresh: state machine на shared values, без источника ввода
 * и без визуала. Источники ввода (скролл, жест) подключаются через
 * beginPull/updatePull/endPull; визуал строится на pullDistance/progress/state.
 */
export const usePullToRefreshController = (
  config: IPullToRefreshConfig,
): IPullToRefreshController => {
  const {
    onRefresh,
    threshold = PULL_TO_REFRESH_DEFAULTS.threshold,
    holdDistance = threshold,
    triggerOn = "threshold",
    minRefreshDuration = PULL_TO_REFRESH_DEFAULTS.minRefreshDuration,
    enabled = true,
    onStateChange,
  } = config;
  const maxDistance = resolveMaxPullDistance(config);
  const settleDuration = PULL_TO_REFRESH_DEFAULTS.settleDuration;

  const pullDistance = useSharedValue(0);
  const state = useSharedValue<TPullToRefreshState>("idle");
  const isDragging = useSharedValue(false);
  const refreshStartedAt = useRef(0);

  const progress = useDerivedValue(
    () => pullDistance.value / threshold,
    [threshold],
  );

  const setState = useCallback(
    (next: TPullToRefreshState) => {
      "worklet";
      const prev = state.value;

      if (prev === next) {
        return;
      }
      state.value = next;
      onStateChange?.(prev, next);
    },
    [state, onStateChange],
  );

  const settle = useCallback(() => {
    "worklet";
    setState("settling");
    pullDistance.value = withTiming(0, { duration: settleDuration }, () => {
      setState("idle");
    });
  }, [pullDistance, setState, settleDuration]);

  const runRefresh = useCallback(() => {
    refreshStartedAt.current = Date.now();
    const result = onRefresh() as Promise<unknown> | undefined;

    if (result && typeof result.then === "function") {
      const complete = () => {
        const elapsed = Date.now() - refreshStartedAt.current;
        const delay = Math.max(0, minRefreshDuration - elapsed);

        setTimeout(() => runOnUI(settle)(), delay);
      };

      result.then(complete, complete);
    }
  }, [minRefreshDuration, onRefresh, settle]);

  const trigger = useCallback(() => {
    "worklet";
    setState("refreshing");
    pullDistance.value = withTiming(holdDistance, {
      duration: settleDuration,
    });
    scheduleOnRN(runRefresh);
  }, [holdDistance, pullDistance, runRefresh, setState, settleDuration]);

  const beginPull = useCallback(() => {
    "worklet";
    isDragging.value = true;
  }, [isDragging]);

  const updatePull = useCallback(
    (distance: number) => {
      "worklet";
      const current = state.value;

      if (
        !enabled ||
        !isDragging.value ||
        current === "refreshing" ||
        current === "settling"
      ) {
        return;
      }

      const clamped = Math.min(Math.max(distance, 0), maxDistance);

      pullDistance.value = clamped;

      if (clamped <= 0) {
        setState("idle");
      } else if (clamped >= threshold) {
        if (triggerOn === "threshold") {
          trigger();
        } else {
          setState("armed");
        }
      } else {
        setState("pulling");
      }
    },
    [
      enabled,
      isDragging,
      maxDistance,
      pullDistance,
      setState,
      state,
      threshold,
      trigger,
      triggerOn,
    ],
  );

  const endPull = useCallback(() => {
    "worklet";
    isDragging.value = false;
    const current = state.value;

    if (current === "armed") {
      trigger();
    } else if (current === "pulling") {
      settle();
    }
  }, [isDragging, settle, state, trigger]);

  const refresh = useCallback(() => {
    runOnUI(() => {
      "worklet";
      if (state.value === "idle") {
        trigger();
      }
    })();
  }, [state, trigger]);

  const finish = useCallback(() => {
    runOnUI(() => {
      "worklet";
      if (state.value === "refreshing") {
        settle();
      }
    })();
  }, [settle, state]);

  return useMemo(
    () => ({
      pullDistance,
      progress,
      state,
      refresh,
      finish,
      beginPull,
      updatePull,
      endPull,
    }),
    [
      pullDistance,
      progress,
      state,
      refresh,
      finish,
      beginPull,
      updatePull,
      endPull,
    ],
  );
};
