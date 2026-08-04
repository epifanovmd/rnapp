import { useCallback, useEffect, useRef, useState } from "react";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";
import {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useInputBarContext } from "../config";
import { IInputBarViewDelegate } from "../model";
import { RecordingState } from "../model";
import { createVoiceRecorder, VoiceRecorder } from "../services";

// ─── Тайминги возврата панели ─────────────
// Возврат разыгрывается последовательно, и именно из-за этого он выглядит
// плавным: строка записи гаснет → микрофон возвращается пружиной → и только
// потом слева появляется кнопка. Значения — 1:1 из реализации.

/** `recordingRow.fadeOut` — гашение строки записи. */
const ROW_FADE_DURATION = 150;
/** Пружина возврата микрофона в исходное положение после отпускания. */
const MIC_RESTORE_DURATION = 200;
/** `restoreInputBar` — пружина появления левой кнопки. */
const LEFT_BUTTON_ENTER_DURATION = 250;
/** Пауза, которую корзина стоит на месте, прежде чем смениться на скрепку. */
const TRASH_HOLD_DURATION = 300;
/** `restoreLeftButtonToClip` — сжатие до 0.6 перед сменой иконки. */
const CLIP_SQUEEZE_DURATION = 150;
/** `restoreLeftButtonToClip` — пружина обратно в полный размер. */
const CLIP_SPRING_DURATION = 200;
/** Масштаб, до которого кнопка сжимается в момент смены иконки. */
const CLIP_SQUEEZE_SCALE = 0.6;

/**
 * Машина состояний записи голоса: жизненный цикл рекордера, переходы
 * idle→recording→locked→idle, хаптика, анимация левой кнопки.
 * Логика записи панели ввода.
 */
export function useRecordingController(
  delegateRef: React.RefObject<IInputBarViewDelegate>,
) {
  const { layout } = useInputBarContext();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [showCancelTrash, setShowCancelTrash] = useState(false);
  // Строка записи живёт дольше самого состояния записи: под гасит её отдельной
  // анимацией и возвращает текстовое поле только после этого.
  const [rowVisible, setRowVisible] = useState(false);
  const rowOpacity = useSharedValue(1);
  const rowHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideRecordingRow = useCallback(
    (delay: number, fade: boolean) => {
      if (fade) {
        rowOpacity.value = withTiming(0, { duration: ROW_FADE_DURATION });
      }
      if (rowHideTimer.current) clearTimeout(rowHideTimer.current);
      rowHideTimer.current = setTimeout(() => setRowVisible(false), delay);
    },
    [rowOpacity],
  );

  useEffect(
    () => () => {
      if (rowHideTimer.current) clearTimeout(rowHideTimer.current);
    },
    [],
  );

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
    if (rowHideTimer.current) clearTimeout(rowHideTimer.current);
    setRowVisible(true);
    rowOpacity.value = 1;
    trigger(HapticFeedbackTypes.impactLight);
    leftButtonScale.value = withTiming(0.01, { duration: 250 });
    leftButtonOpacity.value = withTiming(0, { duration: 250 });
    leftButtonWidth.value = withTiming(0, { duration: 250 });
    recorderRef.current?.startRecording();
    delegateRef.current.onRecordingStateChanged(true);
  }, [
    delegateRef,
    leftButtonScale,
    leftButtonOpacity,
    leftButtonWidth,
    rowOpacity,
  ]);

  /** Возврат панели: место под кнопку и её проявление. */
  const restoreLeftButtonBox = useCallback(
    (delay: number) => {
      leftButtonOpacity.value = withDelay(
        delay,
        withTiming(1, { duration: LEFT_BUTTON_ENTER_DURATION }),
      );
      leftButtonWidth.value = withDelay(
        delay,
        withSpring(1, {
          duration: LEFT_BUTTON_ENTER_DURATION,
          dampingRatio: 0.65,
        }),
      );
    },
    [leftButtonOpacity, leftButtonWidth],
  );

  const enterScale = useCallback(
    () =>
      withSpring(1, {
        duration: LEFT_BUTTON_ENTER_DURATION,
        dampingRatio: 0.65,
      }),
    [],
  );

  /**
   * Кнопка сжимается до 0.6, в нижней точке иконка меняется
   * с корзины на скрепку, и пружина возвращает полный размер.
   * Иконка переключается в колбэке завершения сжатия.
   */
  const squeezeScale = useCallback(
    () =>
      withTiming(
        CLIP_SQUEEZE_SCALE,
        { duration: CLIP_SQUEEZE_DURATION, easing: Easing.in(Easing.ease) },
        finished => {
          "worklet";
          if (finished) scheduleOnRN(setShowCancelTrash, false);
        },
      ),
    [],
  );

  const springBackScale = useCallback(
    () => withSpring(1, { duration: CLIP_SPRING_DURATION, dampingRatio: 0.7 }),
    [],
  );

  const finishRecording = useCallback(() => {
    const wasLocked = recordingStateRef.current === "locked";
    // Из обычной записи под сперва возвращает микрофон пружиной и только потом
    // выпускает левую кнопку; из закреплённой — сразу, микрофон уже на месте.
    const delay = wasLocked ? 0 : MIC_RESTORE_DURATION;

    setRecordingState("idle");
    setShowCancelTrash(false);
    // Отпускание строку не гасит — она убирается в момент возврата.
    hideRecordingRow(delay, false);
    // Из закреплённой записи кнопка стоит на месте с корзиной — прячем её,
    // чтобы она выехала уже со скрепкой.
    if (wasLocked) {
      leftButtonScale.value = 0.01;
      leftButtonOpacity.value = 0;
    }
    restoreLeftButtonBox(delay);
    leftButtonScale.value = withDelay(delay, enterScale());
    recorderRef.current?.stopRecording();
    delegateRef.current.onRecordingStateChanged(false);
  }, [
    delegateRef,
    hideRecordingRow,
    restoreLeftButtonBox,
    enterScale,
    leftButtonScale,
    leftButtonOpacity,
  ]);

  const cancelRecording = useCallback(() => {
    const wasLocked = recordingStateRef.current === "locked";

    setRecordingState("idle");
    setShowCancelTrash(true);
    trigger(HapticFeedbackTypes.notificationError);
    // Отмена — единственный путь, где под гасит строку записи анимацией.
    hideRecordingRow(
      wasLocked ? ROW_FADE_DURATION : ROW_FADE_DURATION + MIC_RESTORE_DURATION,
      true,
    );

    if (wasLocked) {
      // Кнопка уже на месте и уже с корзиной — остаётся только морф в скрепку
      // после гашения строки записи.
      leftButtonScale.value = withDelay(
        ROW_FADE_DURATION,
        withSequence(squeezeScale(), springBackScale()),
      );
    } else {
      // Свайпом: строка гаснет, микрофон возвращается пружиной, затем выезжает
      // корзина, держится TRASH_HOLD_DURATION и морфится в скрепку.
      const enterDelay = ROW_FADE_DURATION + MIC_RESTORE_DURATION;

      restoreLeftButtonBox(enterDelay);
      leftButtonScale.value = withDelay(
        enterDelay,
        withSequence(
          enterScale(),
          withDelay(TRASH_HOLD_DURATION, squeezeScale()),
          springBackScale(),
        ),
      );
    }

    recorderRef.current?.cancelRecording();
    delegateRef.current.onVoiceRecordingCancelled?.();
    delegateRef.current.onRecordingStateChanged(false);
  }, [
    delegateRef,
    hideRecordingRow,
    restoreLeftButtonBox,
    enterScale,
    squeezeScale,
    springBackScale,
    leftButtonScale,
  ]);

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
    /** Строка записи ещё на экране (в т.ч. пока догорает её анимация). */
    rowVisible,
    rowOpacity,
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
