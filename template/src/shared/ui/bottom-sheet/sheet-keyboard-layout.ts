/** Отступ от низа шторки до клавиатуры, когда она открыта, px. */
export const SHEET_KEYBOARD_GAP = 12;

/**
 * Нижний отступ раскладки шторки: при закрытой клавиатуре — safe area
 * (home indicator), при открытой — обычный зазор: клавиатура сама закрывает
 * home indicator. Между ними — по прогрессу клавиатуры.
 */
export const resolveSheetBottomPadding = (
  safeAreaBottom: number,
  keyboardProgress: number,
) => {
  "worklet";
  const progress = Math.min(Math.max(keyboardProgress, 0), 1);

  return safeAreaBottom + (SHEET_KEYBOARD_GAP - safeAreaBottom) * progress;
};

export interface ISheetKeyboardInsetInput {
  hasFooter: boolean;
  footerHeight: number;
  /** Зазор раскладки между контентом и футером. */
  gap: number;
}

/** Расстояние от низа скролла шторки до верха клавиатуры при открытой клавиатуре. */
export const resolveSheetKeyboardInset = ({
  hasFooter,
  footerHeight,
  gap,
}: ISheetKeyboardInsetInput) =>
  (hasFooter ? footerHeight + gap : 0) + SHEET_KEYBOARD_GAP;
