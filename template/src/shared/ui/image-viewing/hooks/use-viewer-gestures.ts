import { useCallback } from "react";
import {
  useExclusiveGestures,
  useLongPressGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useDismissGesture } from "./use-dismiss-gesture";
import { useZoomGesture } from "./use-zoom-gesture";

export interface IViewerGesturesOptions {
  containerWidth: number;
  containerHeight: number;
  contentWidth: number;
  contentHeight: number;
  maxScale: number;
  doubleTapScale: number;
  swipeToCloseEnabled: boolean;
  doubleTapToZoomEnabled: boolean;
  /** 0..1 — прогресс свайпа-закрытия (фон/бары читают его в родителе). */
  dismissProgress: SharedValue<number>;
  onZoomChange?: (zoomed: boolean) => void;
  onSingleTap?: () => void;
  onLongPress?: () => void;
  onDismiss?: () => void;
}

/** Насколько слайд уменьшается по мере смахивания. */
const DISMISS_SCALE_SHRINK = 0.2;
/** Мягкий предел затухания слайда при перетаскивании (полный ноль — при закрытии). */
const DISMISS_OPACITY_FACTOR = 0.6;
const LONG_PRESS_DURATION = 500;

/**
 * Композиция жестов слайда: зум (use-zoom-gesture) + смахивание-закрытие
 * (use-dismiss-gesture) + single-tap + long-press. Склеивает их отношения,
 * итоговый animatedStyle (транформы обеих осей независимы) и общий reset.
 */
export const useViewerGestures = ({
  containerWidth,
  containerHeight,
  contentWidth,
  contentHeight,
  maxScale,
  doubleTapScale,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  dismissProgress,
  onZoomChange,
  onSingleTap,
  onLongPress,
  onDismiss,
}: IViewerGesturesOptions) => {
  const zoom = useZoomGesture({
    containerWidth,
    containerHeight,
    contentWidth,
    contentHeight,
    maxScale,
    doubleTapScale,
    doubleTapToZoomEnabled,
    onZoomChange,
  });

  const dismiss = useDismissGesture({
    containerHeight,
    enabled: !zoom.zoomed && swipeToCloseEnabled,
    pinchActive: zoom.pinchActive,
    dismissProgress,
    onDismiss,
  });

  const singleTapGesture = useTapGesture({
    numberOfTaps: 1,
    onActivate: () => {
      if (onSingleTap) {
        scheduleOnRN(onSingleTap);
      }
    },
  });

  const longPressGesture = useLongPressGesture({
    minDuration: LONG_PRESS_DURATION,
    onActivate: () => {
      if (onLongPress) {
        scheduleOnRN(onLongPress);
      }
    },
  });

  const tapsGesture = useExclusiveGestures(
    zoom.doubleTapGesture,
    singleTapGesture,
  );

  const gesture = useSimultaneousGestures(
    zoom.pinchGesture,
    zoom.panGesture,
    dismiss.gesture,
    tapsGesture,
    longPressGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(
      dismiss.itemOpacity.value,
      1 - dismissProgress.value * DISMISS_OPACITY_FACTOR,
    ),
    transform: [
      { translateX: zoom.translateX.value },
      { translateY: zoom.translateY.value + dismiss.translateY.value },
      {
        scale:
          zoom.scale.value * (1 - DISMISS_SCALE_SHRINK * dismissProgress.value),
      },
    ],
  }));

  const zoomReset = zoom.reset;
  const dismissReset = dismiss.reset;

  /** Полный сброс слайда (уход со слайда, закрытие). */
  const reset = useCallback(() => {
    zoomReset();
    dismissReset();
  }, [zoomReset, dismissReset]);

  return { gesture, animatedStyle, zoomed: zoom.zoomed, reset };
};
