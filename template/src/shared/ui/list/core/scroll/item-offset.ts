export interface IItemOffsetParams {
  /** Позиция элемента в координатах контента. */
  position: number;
  size: number;
  /** Размер вьюпорта вдоль оси скролла. */
  scrollLength: number;
  /** Куда прижать элемент во вьюпорте: 0 к началу, 1 к концу, 0.5 по центру. */
  viewPosition?: number;
  /** Дополнительный сдвиг результата вверх, px. */
  viewOffset?: number;
}

/**
 * Смещение скролла, при котором элемент встаёт в заданное место вьюпорта.
 *
 * Зачем нужно: одна и та же формула нужна и `scrollToIndex`, и стартовой
 * позиции `initialScroll: { type: "index" }`. Разъехавшись, эти два места дали
 * бы список, открывающийся не там, куда к нему потом скроллят.
 *
 * Результат не уходит выше начала контента: отрицательное смещение нативный
 * слой всё равно подтянет к нулю, но диапазон отрисовки успел бы посчитаться по
 * несуществующей позиции.
 */
export const getItemScrollOffset = ({
  position,
  size,
  scrollLength,
  viewPosition = 0,
  viewOffset = 0,
}: IItemOffsetParams): number =>
  Math.max(0, position - viewPosition * (scrollLength - size) - viewOffset);
