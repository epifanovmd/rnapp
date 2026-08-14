import { IScrollTelemetry } from "@shared/lib/scroll";
import { useMemo } from "react";
import { Platform } from "react-native";
import {
  GestureStateManager,
  useNativeGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

import { IPullToRefreshConfig } from "./pull-to-refresh.types";
import { rubberBandDistance } from "./rubber-band";
import {
  resolveMaxPullDistance,
  usePullToRefreshController,
} from "./use-pull-to-refresh-controller";

export interface IPullToRefreshScrollConfig extends IPullToRefreshConfig {
  /** Телеметрия скролла компонента (useScrollTelemetry) */
  telemetry: IScrollTelemetry;
}

/** Порог движения пальца для ручной активации pan-жеста (Android) */
const ACTIVATION_SLOP = 6;

/**
 * Адаптер pull-to-refresh для скроллящихся компонентов поверх телеметрии
 * (useScrollTelemetry): собственного scroll-хендлера у адаптера нет.
 *
 * iOS — протяжка снимается с native bounce (overscrollTop телеметрии),
 * компонент должен оставлять bounces={true}. Android — pan-жест с ручной
 * активацией: включается только у верхней границы при движении вниз, пока
 * жест не активирован — скролл работает как обычно.
 *
 * Подключение: onScroll={telemetry.scrollHandler} + scrollEventThrottle={16},
 * компонент обёрнут в <GestureDetector gesture={gesture}>.
 *
 * В worklet'ах (useAnimatedStyle и т.п.) не захватывать возвращаемый объект
 * целиком — клонирование на UI-поток заморозит вложенный gesture; брать
 * нужные shared values деструктуризацией.
 */
export const usePullToRefreshScroll = (config: IPullToRefreshScrollConfig) => {
  const { telemetry, enabled = true } = config;
  const controller = usePullToRefreshController(config);
  const maxDistance = resolveMaxPullDistance(config);
  const pullFromGesture = Platform.OS !== "ios";

  const touchStartY = useSharedValue(0);
  const pullStartTranslationY = useSharedValue<number | null>(null);

  useAnimatedReaction(
    () => telemetry.isDragging.value,
    (dragging, prevDragging) => {
      if (dragging === prevDragging) {
        return;
      }

      if (dragging) {
        controller.beginPull();
      } else {
        controller.endPull();
      }
    },
    [controller, telemetry],
  );

  useAnimatedReaction(
    () => telemetry.overscrollTop.value,
    (overscroll, prevOverscroll) => {
      if (!pullFromGesture && overscroll !== prevOverscroll) {
        controller.updatePull(overscroll);
      }
    },
    [controller, pullFromGesture, telemetry],
  );

  const pan = usePanGesture({
    enabled: pullFromGesture && enabled,
    manualActivation: true,
    onTouchesDown: event => {
      "worklet";
      touchStartY.value = event.allTouches[0]?.y ?? 0;
      pullStartTranslationY.value = null;
    },
    onTouchesMove: event => {
      "worklet";
      const dy = (event.allTouches[0]?.y ?? 0) - touchStartY.value;

      if (dy < -ACTIVATION_SLOP || controller.state.value === "refreshing") {
        GestureStateManager.fail(event.handlerTag);
      } else if (dy > ACTIVATION_SLOP && telemetry.offsetY.value <= 0) {
        GestureStateManager.activate(event.handlerTag);
      }
    },
    onActivate: () => {
      "worklet";
      controller.beginPull();
    },
    onUpdate: event => {
      "worklet";
      if (telemetry.offsetY.value > 0) {
        pullStartTranslationY.value = null;
        controller.updatePull(0);

        return;
      }

      if (pullStartTranslationY.value === null) {
        pullStartTranslationY.value = event.translationY;
      }

      const raw = event.translationY - pullStartTranslationY.value;

      controller.updatePull(rubberBandDistance(raw, maxDistance));
    },
    onFinalize: () => {
      "worklet";
      controller.endPull();
    },
  });

  // native-жест скролла регистрируется в системе GH — pan корректно
  // сосуществует со скроллом, пока не активирован вручную
  const native = useNativeGesture();
  const gesture = useSimultaneousGestures(native, pan);

  /**
   * Смещение для контента, если визуал двигает контент за протяжкой:
   * на iOS 0 (контент двигает сам bounce), на Android = pullDistance.
   */
  const contentTranslateY = useDerivedValue(
    () => (pullFromGesture ? controller.pullDistance.value : 0),
    [pullFromGesture],
  );

  return useMemo(
    () => ({ ...controller, gesture, contentTranslateY }),
    [contentTranslateY, controller, gesture],
  );
};

export type TPullToRefreshScroll = ReturnType<typeof usePullToRefreshScroll>;
