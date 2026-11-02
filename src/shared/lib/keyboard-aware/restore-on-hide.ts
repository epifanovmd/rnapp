import {
  clampScrollOffset,
  interpolateScrollOffset,
} from "./keyboard-aware-offset";

export interface IRestoreOnHideFlags {
  /** Опция `restoreOnHide`. */
  enabled: boolean;
  /** Положение запомнено при открытии клавиатуры из закрытого состояния. */
  hasSaved: boolean;
  /** Пользователь тащил скролл, пока клавиатура была открыта. */
  userDragged: boolean;
  /** Клавиатуру закрывают пальцем (iOS interactive dismiss). */
  interactiveDismiss: boolean;
}

/** Возвращать ли скролл к запомненному положению при закрытии клавиатуры. */
export const shouldRestoreOnHide = ({
  enabled,
  hasSaved,
  userDragged,
  interactiveDismiss,
}: IRestoreOnHideFlags) => {
  "worklet";

  return enabled && hasSaved && !userDragged && !interactiveDismiss;
};

/** Цель возврата: запомненное положение в пределах контента без распорки. */
export const computeRestoreOffset = (saved: number, maxOffset: number) => {
  "worklet";

  return clampScrollOffset(saved, maxOffset);
};

/**
 * Смещение на кадре закрытия: от положения в начале закрытия к цели по
 * прогрессу, не дальше конца контента с текущей (уменьшающейся) распоркой.
 */
export const restoreFrameOffset = (
  from: number,
  to: number,
  progress: number,
  maxOffset: number,
) => {
  "worklet";

  return clampScrollOffset(
    interpolateScrollOffset(from, to, progress),
    maxOffset,
  );
};
