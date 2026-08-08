import React, { FC, memo, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";
import { runOnJS, useSharedValue } from "react-native-reanimated";

import { useCameraApi } from "../core/camera-context";
import type { ICameraPoint } from "../core/types";

export interface ICameraGestureLayerProps {
  /** Пинч-зум на кадре */
  pinchToZoom?: boolean;
  /** Тап по кадру — фокус в точку касания */
  tapToFocus?: boolean;
  /** Двойной тап — плавный сброс зума к 1× */
  doubleTapToResetZoom?: boolean;
}

/**
 * Прозрачный слой жестов поверх превью. Зум меняется на UI-потоке без
 * прохода через JS; фокус уходит в нативную камеру через API контекста.
 * Кладите его поверх оверлеев, но под кнопками контролов.
 */
export const CameraGestureLayer: FC<ICameraGestureLayerProps> = memo(
  ({ pinchToZoom = true, tapToFocus = true, doubleTapToResetZoom = true }) => {
    const { zoom, focus } = useCameraApi();
    const { zoom: zoomValue, minZoom, maxZoom, isInteracting } = zoom;

    const pinchStartZoom = useSharedValue(1);

    const handleFocus = useCallback(
      (point: ICameraPoint) => {
        trigger(HapticFeedbackTypes.impactLight);
        focus.focusAt(point);
      },
      [focus],
    );

    const handleResetZoom = useCallback(() => {
      trigger(HapticFeedbackTypes.impactLight);
      zoom.setZoom(1);
    }, [zoom]);

    const gesture = useMemo(() => {
      const pinch = Gesture.Pinch()
        .enabled(pinchToZoom)
        .onBegin(() => {
          pinchStartZoom.value = zoomValue.value;
          isInteracting.value = true;
        })
        .onUpdate(event => {
          const next = pinchStartZoom.value * event.scale;

          zoomValue.value = Math.min(Math.max(next, minZoom), maxZoom);
        })
        .onFinalize(() => {
          isInteracting.value = false;
        });

      const tap = Gesture.Tap()
        .enabled(tapToFocus)
        .onEnd(event => {
          runOnJS(handleFocus)({ x: event.x, y: event.y });
        });

      const doubleTap = Gesture.Tap()
        .enabled(doubleTapToResetZoom)
        .numberOfTaps(2)
        .onEnd(() => {
          runOnJS(handleResetZoom)();
        });

      // Race: активация пинча отменяет тапы, иначе быстрые пинчи подряд
      // засчитываются как двойной тап и сбрасывают зум. Одиночный тап при
      // этом не ждёт провала двойного: фокус должен быть мгновенным.
      return Gesture.Race(pinch, Gesture.Simultaneous(doubleTap, tap));
    }, [
      pinchToZoom,
      tapToFocus,
      doubleTapToResetZoom,
      pinchStartZoom,
      zoomValue,
      isInteracting,
      minZoom,
      maxZoom,
      handleFocus,
      handleResetZoom,
    ]);

    return (
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false} />
      </GestureDetector>
    );
  },
);
