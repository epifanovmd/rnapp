/**
 * Чистая геометрия докрутки скролла к полю над клавиатурой. Все координаты —
 * в системе окна (как у `measure` / `pageY`), смещения — `contentOffset.y`.
 */

export interface IKeyboardAwareOffsetInput {
  /** Верх поля (контейнер целиком: label, ввод, описание, ошибка). */
  fieldTop: number;
  /** Низ поля. */
  fieldBottom: number;
  /** Верх видимой области: верх скролла плюс перекрытие шапкой. */
  visibleTop: number;
  /** Низ скролла; по умолчанию — низ экрана. */
  viewportBottom?: number;
  screenHeight: number;
  /** Высота клавиатуры, к которой едем (0 — скрыта). */
  keyboardHeight: number;
  /** Зазор между полем и клавиатурой (или низом скролла). */
  bottomOffset: number;
  /** Смещение, при котором измерены `fieldTop`/`fieldBottom`. */
  currentOffset: number;
  /** Максимальное смещение с учётом распорки. */
  maxOffset: number;
}

/** Ограничить смещение диапазоном `[0, maxOffset]`. */
export const clampScrollOffset = (offset: number, maxOffset: number) => {
  "worklet";

  return Math.min(Math.max(offset, 0), Math.max(maxOffset, 0));
};

/**
 * Целевое смещение скролла: поле целиком над клавиатурой с зазором
 * `bottomOffset`. Поле, ушедшее выше видимого верха, возвращается вниз к
 * верху. Поле выше видимой области не поднимается: если оно не помещается,
 * к верху прижимается его начало.
 */
export const computeKeyboardAwareOffset = ({
  fieldTop,
  fieldBottom,
  visibleTop,
  viewportBottom,
  screenHeight,
  keyboardHeight,
  bottomOffset,
  currentOffset,
  maxOffset,
}: IKeyboardAwareOffsetInput) => {
  "worklet";

  const keyboardTop = screenHeight - Math.max(keyboardHeight, 0);
  const visibleBottom =
    Math.min(viewportBottom ?? screenHeight, keyboardTop) - bottomOffset;

  let delta = 0;

  if (fieldBottom > visibleBottom) {
    // Не выше видимого верха: высокое поле прижимается началом.
    delta = Math.min(fieldBottom - visibleBottom, fieldTop - visibleTop);
  } else if (fieldTop < visibleTop) {
    delta = fieldTop - visibleTop;
  }

  return clampScrollOffset(currentOffset + delta, maxOffset);
};

/**
 * Прогресс анимации клавиатуры 0..1 от высоты `from` к `to`. Без изменения
 * высоты (смена поля при открытой клавиатуре) — сразу 1.
 */
export const keyboardProgress = (height: number, from: number, to: number) => {
  "worklet";

  if (Math.abs(to - from) < 1) return 1;

  return Math.min(Math.max((height - from) / (to - from), 0), 1);
};

/** Смещение на кадре: от начального к целевому по прогрессу клавиатуры. */
export const interpolateScrollOffset = (
  from: number,
  to: number,
  progress: number,
) => {
  "worklet";

  return from + (to - from) * progress;
};

/** Сколько клавиатура перекрывает скролл снизу — высота распорки. */
export const keyboardOverlap = (
  viewportBottom: number,
  screenHeight: number,
  keyboardHeight: number,
) => {
  "worklet";

  if (keyboardHeight <= 0) return 0;

  return Math.max(viewportBottom - (screenHeight - keyboardHeight), 0);
};

/**
 * Максимальное смещение: распорка — последний элемент контента, после неё
 * отступов нет, поэтому конец контента = её верх плюс высота.
 */
export const computeMaxScrollOffset = (
  spacerContentTop: number,
  spacerHeight: number,
  viewportHeight: number,
) => {
  "worklet";

  return Math.max(spacerContentTop + spacerHeight - viewportHeight, 0);
};
