import { useCallback, useEffect, useRef, useState } from "react";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";
import {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useInputBarContext } from "../model/input-bar-context";
import { IInputBarViewDelegate } from "../model/input-bar-delegate";
import { RecordingState } from "../model/input-bar-types";
import { createVoiceRecorder, VoiceRecorder } from "../model/voice-recorder";

/**
 * Машина состояний записи голоса: жизненный цикл рекордера, переходы
 * idle→recording→locked→idle, хаптика, анимация левой кнопки.
 * Порт InputBarView+Recording из пода.
 */
export function useRecordingController(
  delegateRef: React.RefObject<IInputBarViewDelegate>,
) {
  const { layout } = useInputBarContext();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [showCancelTrash, setShowCancelTrash] = useState(false);

  const recordingStateRef = useRef(recordingState);

  recordingStateRef.current = recordingState;

  // ─── Рекордер ────────────────────────────────────────────────────────────

  const recorderRef = useRef<VoiceRecorder | null>(null);

  if (!recorderRef.current) {
    recorderRef.current = createVoiceRecorder();
  }

  useEffect(() => {
    const recorder = recorderRef.current!;

    recorder.delegate = {
      onUpdateDuration: setRecordDuration,
      onStop: result => delegateRef.current.onVoiceRecordingComplete(result),
    };

    return () => {
      recorder.cancelRecording();
    };
  }, [delegateRef]);

  // ─── Анимация левой кнопки ───────────────────────────────────────────────

  const leftButtonScale = useSharedValue(1);
  const leftButtonOpacity = useSharedValue(1);
  const leftButtonWidth = useSharedValue(1);

  // ─── Действия ────────────────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    setRecordingState("recording");
    setRecordDuration(0);
    setShowCancelTrash(false);
    trigger(HapticFeedbackTypes.impactLight);
    leftButtonScale.value = withTiming(0.01, { duration: 250 });
    leftButtonOpacity.value = withTiming(0, { duration: 250 });
    leftButtonWidth.value = withTiming(0, { duration: 250 });
    recorderRef.current?.startRecording();
    delegateRef.current.onRecordingStateChanged(true);
  }, [delegateRef, leftButtonScale, leftButtonOpacity, leftButtonWidth]);

  const finishRecording = useCallback(() => {
    setRecordingState("idle");
    setShowCancelTrash(false);
    leftButtonScale.value = withSpring(1, {
      duration: 250,
      dampingRatio: 0.65,
    });
    leftButtonOpacity.value = withTiming(1, { duration: 250 });
    leftButtonWidth.value = withSpring(1, {
      duration: 250,
      dampingRatio: 0.65,
    });
    recorderRef.current?.stopRecording();
    delegateRef.current.onRecordingStateChanged(false);
  }, [delegateRef, leftButtonScale, leftButtonOpacity, leftButtonWidth]);

  const cancelRecording = useCallback(() => {
    setRecordingState("idle");
    setShowCancelTrash(true);
    trigger(HapticFeedbackTypes.notificationError);
    leftButtonScale.value = withSpring(1, {
      duration: 250,
      dampingRatio: 0.65,
    });
    leftButtonOpacity.value = withTiming(1, { duration: 250 });
    leftButtonWidth.value = withSpring(1, {
      duration: 250,
      dampingRatio: 0.65,
    });
    setTimeout(() => {
      setShowCancelTrash(false);
    }, 300);
    recorderRef.current?.cancelRecording();
    delegateRef.current.onVoiceRecordingCancelled?.();
    delegateRef.current.onRecordingStateChanged(false);
  }, [delegateRef, leftButtonScale, leftButtonOpacity, leftButtonWidth]);

  const lockRecording = useCallback(() => {
    setRecordingState("locked");
    setShowCancelTrash(false);
    trigger(HapticFeedbackTypes.impactMedium);
    leftButtonScale.value = withDelay(
      100,
      withSpring(1, { duration: 250, dampingRatio: 0.65 }),
    );
    leftButtonOpacity.value = withDelay(100, withTiming(1, { duration: 250 }));
    leftButtonWidth.value = withDelay(
      100,
      withSpring(1, { duration: 250, dampingRatio: 0.65 }),
    );
  }, [leftButtonScale, leftButtonOpacity, leftButtonWidth]);

  return {
    recordingState,
    recordDuration,
    isRecording: recordingState !== "idle",
    isLocked: recordingState === "locked",
    showCancelTrash,
    startRecording,
    finishRecording,
    cancelRecording,
    lockRecording,
    leftButtonScale,
    leftButtonOpacity,
    leftButtonWidth,
  };
}
