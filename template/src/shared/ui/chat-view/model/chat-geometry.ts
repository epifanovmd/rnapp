/**
 * Геометрия списка в том виде, в каком её требует логика чата.
 *
 * DIP: якорь скролла, плавающая дата и расчёт видимости не должны знать,
 * какой библиотекой отрисован список. Им нужны четыре величины — позиция
 * скролла, высота вьюпорта, размер контента и координаты строки, — поэтому
 * зависят они от этого интерфейса, а не от `LegendList`.
 *
 * Эталон (`ChatViewController`) читает те же значения напрямую из
 * `UICollectionView` (`contentOffset`, `bounds`, `contentSize`) и из
 * `chatLayout.yOffsets` / `rowLayoutData`.
 */
export interface IChatGeometry {
  /** Текущая позиция скролла (px). Порт `contentOffset.y`. */
  readonly scrollY: number;
  /** Высота видимой области. Порт `bounds.height`. */
  readonly viewportHeight: number;
  /** Полный размер контента. Порт `contentSize.height`. */
  readonly contentHeight: number;
  /** Верхняя координата строки в контенте, либо `undefined` если не измерена. */
  rowTop(index: number): number | undefined;
  /** Высота строки, либо `undefined` если не измерена. */
  rowHeight(index: number): number | undefined;
  /** Индексы строк, попадающих в видимую область (без буфера). */
  readonly visibleRange: { start: number; end: number };
}

/** Нижняя граница строки в координатах контента. Порт `cellBottom`. */
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
 * Расстояние до конца контента. Порт `distanceFromBottom()`.
 *
 * Нижняя зона (панель ввода, клавиатура) уже учтена инсетом контента,
 * поэтому дополнительных поправок не требуется.
 */
export const distanceFromBottom = (geometry: IChatGeometry): number =>
  Math.max(
    0,
    geometry.contentHeight - geometry.scrollY - geometry.viewportHeight,
  );

/** Порт `isNearBottom()`. */
export const isNearBottom = (
  geometry: IChatGeometry,
  threshold: number,
): boolean => {
  if (geometry.contentHeight <= 0) return true;

  return distanceFromBottom(geometry) <= threshold;
};
