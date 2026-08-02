/**
 * Геометрия списка в том виде, в каком её требует логика чата.
 *
 * Якорь, плавающая дата, аватары и видимость не должны знать, какой
 * библиотекой отрисован список: им нужны позиция скролла, высота вьюпорта,
 * размер контента и координаты строки.
 */
export interface IChatGeometry {
  /** Текущая позиция скролла (px). */
  readonly scrollY: number;
  /** Высота видимой области. */
  readonly viewportHeight: number;
  /** Полный размер контента. */
  readonly contentHeight: number;
  /** Верхняя координата строки в контенте, либо `undefined` если не измерена. */
  rowTop(index: number): number | undefined;
  /** Высота строки, либо `undefined` если не измерена. */
  rowHeight(index: number): number | undefined;
  /** Индексы строк, попадающих в видимую область (без буфера). */
  readonly visibleRange: { start: number; end: number };
}

/** Нижняя граница строки в координатах контента. */
export const rowBottom = (
  geometry: IChatGeometry,
  index: number,
): number | undefined => {
  const top = geometry.rowTop(index);
  const height = geometry.rowHeight(index);

  if (top == null || height == null) return undefined;

  return top + height;
};

/**
 * Расстояние до конца контента.
 *
 * Нижняя зона (панель ввода, клавиатура) уже учтена инсетом контента,
 * поэтому дополнительных поправок не требуется.
 */
export const distanceFromBottom = (geometry: IChatGeometry): number =>
  Math.max(
    0,
    geometry.contentHeight - geometry.scrollY - geometry.viewportHeight,
  );

/** Внизу ли скролл. */
export const isNearBottom = (
  geometry: IChatGeometry,
  threshold: number,
): boolean => {
  if (geometry.contentHeight <= 0) return true;

  return distanceFromBottom(geometry) <= threshold;
};
