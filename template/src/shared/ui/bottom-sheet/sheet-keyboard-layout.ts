/** Зазор между футером шторки и клавиатурой, px. */
export const SHEET_KEYBOARD_GAP = 12;

export interface ISheetKeyboardLayoutInput {
  /** Текущая высота клавиатуры (покадрово). */
  keyboardHeight: number;
  /**
   * Позиция шторки в покое — расстояние от верха контейнера gorhom (он уже
   * отступает от верха экрана на `topInset`) до верха шторки: столько
   * шторка может подняться.
   */
  restPosition: number;
  /** Нижний отступ раскладки в покое (home indicator). */
  safeAreaBottom: number;
  gap?: number;
}

/**
 * Положение шторки над клавиатурой: низ контента должен подняться так, чтобы
 * футер встал на `gap` над клавиатурой (safe area закрывается клавиатурой).
 * Подъём идёт сдвигом шторки, пока есть место до верха; остаток — нижним
 * отступом раскладки (область формы ужимается). Зазор набирается первыми
 * `gap` px хода клавиатуры — без скачка на старте.
 */
export const computeSheetKeyboardLayout = ({
  keyboardHeight,
  restPosition,
  safeAreaBottom,
  gap: gapOption,
}: ISheetKeyboardLayoutInput) => {
  "worklet";
  // Значение по умолчанию — в теле: плагин worklets не захватывает
  // идентификаторы из выражений параметров, на UI-потоке константы нет.
  const gap = gapOption ?? SHEET_KEYBOARD_GAP;
  const keyboard = Math.max(keyboardHeight, 0);
  const rise = Math.max(keyboard + Math.min(keyboard, gap) - safeAreaBottom, 0);
  const lift = Math.min(rise, Math.max(restPosition, 0));

  return {
    translateY: 0 - lift,
    paddingBottom: safeAreaBottom + rise - lift,
  };
};

/**
 * Шторка начала закрываться (gorhom `onAnimate` → индекс −1): клавиатуру
 * закрываем в тот же момент — шторка и клавиатура уходят вместе, а не
 * клавиатура после шторки.
 */
export const isSheetClosing = (fromIndex: number, toIndex: number) =>
  toIndex === -1 && fromIndex !== -1;
