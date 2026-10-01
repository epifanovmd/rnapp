/**
 * Чистая геометрия индикатора Segmented: замеры сегментов и диапазоны
 * интерполяции по позиции пейджера. Без RN — покрывается юнит-тестами.
 */

export interface ISegmentLayout {
  x: number;
  width: number;
}

export interface IIndicatorRanges {
  /** Индексы вкладок — inputRange интерполяции позиции */
  inputRange: number[];
  /** translateX левой скруглённой шапки */
  startCapX: number[];
  /** translateX правой скруглённой шапки */
  endCapX: number[];
  /** translateX тела шириной 1px (с поправкой на transform-origin в центре) */
  bodyX: number[];
  /** scaleX тела — его ширина, px */
  bodyScale: number[];
}

export interface IOpacityRange {
  inputRange: number[];
  outputRange: number[];
}

/** Перекрытие тела и шапок, px: без шва на дробных координатах */
const BODY_OVERLAP = 1;

/** Индексы для interpolate: ему нужно минимум две точки */
const indexRange = (count: number): number[] =>
  Array.from({ length: Math.max(count, 2) }, (_, index) => index);

/** Замер сегмента по индексу; длина — текущее число сегментов */
export const mergeSegmentLayout = (
  layouts: ISegmentLayout[],
  count: number,
  index: number,
  layout: ISegmentLayout,
): ISegmentLayout[] =>
  Array.from({ length: count }, (_, i) =>
    i === index ? layout : (layouts[i] ?? { x: 0, width: 0 }),
  );

/** Все сегменты замерены — индикатор можно строить */
export const isLayoutComplete = (
  layouts: ISegmentLayout[],
  count: number,
): boolean =>
  count > 0 &&
  layouts.length === count &&
  layouts.every(layout => layout.width > 0);

/**
 * Диапазоны трёх слоёв подложки: две шапки шириной `cap` со скруглением и
 * тело 1px, растянутое scaleX. Только transform — работает на нативном
 * драйвере, а скругление не искажается растяжением.
 */
export const buildIndicatorRanges = (
  layouts: ISegmentLayout[],
  cap: number,
): IIndicatorRanges => {
  const inputRange = indexRange(layouts.length);
  const at = (index: number) =>
    layouts[Math.min(index, layouts.length - 1)] ?? { x: 0, width: 0 };

  return {
    inputRange,
    startCapX: inputRange.map(index => at(index).x),
    endCapX: inputRange.map(index => at(index).x + at(index).width - cap),
    bodyX: inputRange.map(index => at(index).x + cap - BODY_OVERLAP - 0.5),
    bodyScale: inputRange.map(index =>
      Math.max(at(index).width - 2 * cap + 2 * BODY_OVERLAP, 1),
    ),
  };
};

/** Непрозрачность слоя подписи: активный виден на своём индексе, неактивный — на остальных */
export const segmentOpacityRange = (
  count: number,
  index: number,
  active: boolean,
): IOpacityRange => {
  const inputRange = indexRange(count);
  const isCurrent = (i: number) => Math.min(i, count - 1) === index;

  return {
    inputRange,
    outputRange: inputRange.map(i => (isCurrent(i) === active ? 1 : 0)),
  };
};

/** Смещение прокрутки, при котором сегмент по центру контейнера */
export const centerScrollX = (
  layout: ISegmentLayout,
  containerWidth: number,
): number => Math.max(0, layout.x + layout.width / 2 - containerWidth / 2);

/** Внутренний отступ дорожки, px */
export const SEGMENT_TRACK_PADDING = 3;

/** Скругление сегмента и подложки, px; оно же ширина шапок подложки */
export const SEGMENT_RADIUS = 9;
