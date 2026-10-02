const NO_TARGET = -1;

export interface IEndCaptureInput {
  keyboardHeight: number;
  hasField: boolean;
  /** Тег поля, захваченного в onStart (-1 — не захвачено). */
  capturedTarget: number;
  /** Тег сфокусированного ввода из onEnd. */
  endTarget: number;
  /** Поле меняло высоту во время анимации клавиатуры. */
  pendingRecapture: boolean;
}

/**
 * Перезамерить поле в onEnd: тег в onStart мог не прийти или прийти от
 * прежнего поля (первый респондер ещё не сменился), а onEnd несёт актуальный;
 * либо поле выросло, пока ехала клавиатура.
 */
export const shouldCaptureOnEnd = ({
  keyboardHeight,
  hasField,
  capturedTarget,
  endTarget,
  pendingRecapture,
}: IEndCaptureInput) => {
  "worklet";

  if (keyboardHeight <= 0 || endTarget === NO_TARGET) return false;

  return !hasField || capturedTarget !== endTarget || pendingRecapture;
};
