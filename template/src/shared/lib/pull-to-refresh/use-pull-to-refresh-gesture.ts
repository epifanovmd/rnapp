import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";

import { IPullToRefreshConfig } from "./pull-to-refresh.types";
import { rubberBandDistance } from "./rubber-band";
import {
  resolveMaxPullDistance,
  usePullToRefreshController,
} from "./use-pull-to-refresh-controller";

/** Порог активации pan-жеста, чтобы не конфликтовать с тапами */
const ACTIVATION_OFFSET = 6;

/**
 * Адаптер pull-to-refresh для произвольных (нескроллящихся) компонентов:
 * протяжку ведёт pan-жест с rubber-band сопротивлением.
 *
 * Подключение: компонент обёрнут в <GestureDetector gesture={gesture}>;
 * визуал строится на pullDistance/progress/state контроллера.
 */
export const usePullToRefreshGesture = (config: IPullToRefreshConfig) => {
  const controller = usePullToRefreshController(config);
  const { enabled = true } = config;
  const maxDistance = resolveMaxPullDistance(config);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetY(ACTIVATION_OFFSET)
        .failOffsetY(-ACTIVATION_OFFSET)
        .onStart(() => {
          controller.beginPull();
        })
        .onUpdate(event => {
          controller.updatePull(
            rubberBandDistance(event.translationY, maxDistance),
          );
        })
        .onFinalize(() => {
          controller.endPull();
        }),
    [controller, enabled, maxDistance],
  );

  return useMemo(() => ({ ...controller, gesture }), [controller, gesture]);
};
