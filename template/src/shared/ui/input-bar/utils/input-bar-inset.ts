/**
 * Перекрытие экрана снизу панелью ввода.
 *
 * Чистые worklet-функции: величина считается на UI-потоке в такт клавиатуре, а
 * правило, по которому она складывается, живёт в одном месте — и потому
 * проверяемо.
 */

/** Из чего складывается перекрытие на этом кадре. */
export interface IInputBarInsetParts {
  /** Высота клавиатуры; 0 — скрыта. */
  keyboardHeight: number;
  safeAreaBottom: number;
  /** Собственная высота панели. */
  barHeight: number;
  /** Что добавлено сверх панели и зоны. */
  extraPadding?: number;
}

/**
 * Перекрытие снизу без панели: клавиатура, а без неё — безопасная зона.
 *
 * Именно максимум, а не сумма: открытая клавиатура закрывает собой и домашний
 * индикатор, и добавлять его отступ поверх неё нечего.
 */
export const resolveInputBarOffset = ({
  keyboardHeight,
  safeAreaBottom,
}: Pick<IInputBarInsetParts, "keyboardHeight" | "safeAreaBottom">): number => {
  "worklet";

  return Math.max(keyboardHeight, safeAreaBottom);
};

/** Полный след панели от низа экрана: перекрытие плюс сама панель. */
export const resolveInputBarInset = (parts: IInputBarInsetParts): number => {
  "worklet";

  return (
    resolveInputBarOffset(parts) + parts.barHeight + (parts.extraPadding ?? 0)
  );
};
