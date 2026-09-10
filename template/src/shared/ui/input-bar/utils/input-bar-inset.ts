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

/** След правого края панели на этом кадре. */
export interface IInputBarEdgeInsetParts extends IInputBarInsetParts {
  /** Высота ряда «вложение — поле — микрофон». */
  rowHeight: number;
  /** 0 — поле в своей колонке, 1 — растянуто на всю ширину ряда. */
  fullWidthProgress: number;
}

/**
 * След правого края панели: докуда занят край, у которого садятся плавающие
 * кнопки.
 *
 * Панель ответа тянется только по ширине поля, поэтому справа от неё край
 * свободен — пока поле не растянулось на всю ширину ряда. Промежуточные
 * значения нужны потому, что микрофон уступает место движением, и кнопка
 * обязана ехать вместе с ним, а не прыгать по готовности.
 */
export const resolveInputBarEdgeInset = (
  parts: IInputBarEdgeInsetParts,
): number => {
  "worklet";

  const full = resolveInputBarInset(parts);
  const row = Math.min(
    full,
    resolveInputBarOffset(parts) + parts.rowHeight + (parts.extraPadding ?? 0),
  );

  return row + (full - row) * parts.fullWidthProgress;
};
