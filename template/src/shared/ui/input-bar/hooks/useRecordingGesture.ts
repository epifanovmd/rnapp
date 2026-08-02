import { useCallback, useEffect, useRef } from "react";
import { usePanGesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useInputBarContext } from "../config";
import { RecordingState } from "../model";

/**
 * Pan-жест записи + shared values для drag-анимации микрофона.
 * Зависит от useRecordingController (получает действия и состояние).
 */
export function useRecordingGesture(
  hasText: boolean,
  recordingState: RecordingState,
  isLocked: boolean,
  startRecording: () => void,
  finishRecording: () => void,
  cancelRecording: () => void,
  lockRecording: () => void,
) {
  const { layout, features } = useInputBarContext();

  const recordingStateRef = useRef(recordingState);

  recordingStateRef.current = recordingState;

  // ─── Shared values жеста ─────────────────────────────────────────────────

  const micTranslateX = useSharedValue(0);
  const micTranslateY = useSharedValue(0);
  const micGestureScale = useSharedValue(1);
  const slideAlpha = useSharedValue(1);
  const lockScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const resetGestureValues = useCallback(() => {
    micTranslateX.value = withSpring(0, { duration: 200, dampingRatio: 0.7 });
    micTranslateY.value = withSpring(0, { duration: 200, dampingRatio: 0.7 });
    micGestureScale.value = withSpring(1, { duration: 200, dampingRatio: 0.7 });
    slideAlpha.value = 1;
    lockScale.value = 1;
  }, [micTranslateX, micTranslateY, micGestureScale, slideAlpha, lockScale]);

  // Оборачиваем finish/cancel/lock с reset значений жеста.
  const finish = useCallback(() => {
    resetGestureValues();
    finishRecording();
  }, [resetGestureValues, finishRecording]);

  const cancel = useCallback(() => {
    resetGestureValues();
    cancelRecording();
  }, [resetGestureValues, cancelRecording]);

  const lock = useCallback(() => {
    resetGestureValues();
    lockRecording();
  }, [resetGestureValues, lockRecording]);

  // ─── Пульсация ───────────────────────────────────────────────────────────
  // Пульсация живёт ровно столько, сколько длится состояние locked. Поэтому
  // она производная от состояния, а не побочный эффект конкретного пути:
  // закреплённую запись останавливают мимо жеста (корзина в левой кнопке,
  // крестик в строке записи, отправка), и при императивном сбросе withRepeat
  // оставался бы крутиться навсегда.
  useEffect(() => {
    if (isLocked) {
      // Кнопка сначала встаёт в базовый масштаб
      // (1.15) и уже от него качается к максимуму (1.28) — поэтому в
      // закреплённой записи она заметно крупнее обычной.
      pulseScale.value = layout.recordPulseBaseScale;
      pulseScale.value = withRepeat(
        withTiming(layout.recordPulseMaxScale, {
          duration: layout.recordPulseDuration * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );

      return;
    }

    cancelAnimation(pulseScale);
    pulseScale.value = withTiming(1, { duration: 150 });
  }, [isLocked, pulseScale, layout]);

  // ─── Drag ────────────────────────────────────────────────────────────────

  const handleDrag = useCallback(
    (dx: number, dy: number) => {
      if (recordingStateRef.current !== "recording") return;

      if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
        const progress = Math.min(
          1,
          Math.abs(dx) / layout.recordCancelThreshold,
        );

        micTranslateX.value = Math.min(0, dx) * 0.8;
        micTranslateY.value = 0;
        micGestureScale.value = 1 - progress * 0.3;
        slideAlpha.value = 1 - progress;
        if (progress >= 1) cancel();
      } else if (dy < 0) {
        const progress = Math.min(1, Math.abs(dy) / layout.recordLockThreshold);

        micTranslateX.value = 0;
        micTranslateY.value = Math.min(0, dy) * 0.8;
        lockScale.value = 1 + progress * 0.2;
        if (progress >= 1) lock();
      } else {
        micTranslateX.value = 0;
        micTranslateY.value = 0;
        micGestureScale.value = 1;
        slideAlpha.value = 1;
        lockScale.value = 1;
      }
    },
    [
      layout,
      micTranslateX,
      micTranslateY,
      micGestureScale,
      slideAlpha,
      lockScale,
      cancel,
      lock,
    ],
  );

  const handleRelease = useCallback(() => {
    if (recordingStateRef.current !== "recording") return;
    finish();
  }, [finish]);

  const voiceEnabled = features.showVoiceRecording;

  const recordGesture = usePanGesture({
    enabled: voiceEnabled && !hasText && !isLocked,
    disableReanimated: true,
    activateAfterLongPress: layout.recordMinPressDuration * 1000,
    onActivate: () => startRecording(),
    onUpdate: e => handleDrag(e.translationX, e.translationY),
    onDeactivate: () => handleRelease(),
  });

  return {
    recordGesture,
    micTranslateX,
    micTranslateY,
    micGestureScale,
    slideAlpha,
    lockScale,
    pulseScale,
  };
}
