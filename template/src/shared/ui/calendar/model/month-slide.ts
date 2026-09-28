/**
 * Математика слайдера месяцев. Позиция — дробный номер страницы: целое
 * значение — месяц стоит ровно, дробное — едет или под пальцем.
 */

export interface ISlideRange {
  /** Страница текущего месяца. */
  current: number;
  /** Крайние страницы, до которых можно дотянуть одним жестом. */
  min: number;
  max: number;
}

export interface IPageHeightStop {
  index: number;
  height: number;
}

/** Во сколько раз медленнее страница идёт за пальцем за пределами доступных. */
export const SWIPE_RESISTANCE = 0.3;
/** Сколько секунд движения по текущей скорости «дотягивают» свайп: быстрый короткий жест тоже засчитывается. */
export const SWIPE_VELOCITY_TOSS = 0.15;

/** Доступные одним жестом страницы: не дальше соседа и только в открытых направлениях. */
export const resolveSlideRange = (
  current: number,
  canGoPrev: boolean,
  canGoNext: boolean,
): ISlideRange => {
  "worklet";

  return {
    current,
    min: canGoPrev ? current - 1 : current,
    max: canGoNext ? current + 1 : current,
  };
};

/** Позиция под пальцем: внутри диапазона как есть, за его пределами — с сопротивлением. */
export const resistPage = (page: number, range: ISlideRange): number => {
  "worklet";
  if (page < range.min)
    return range.min - (range.min - page) * SWIPE_RESISTANCE;
  if (page > range.max)
    return range.max + (page - range.max) * SWIPE_RESISTANCE;

  return page;
};

/**
 * Куда доедет страница после отпускания: ближайшая к спроецированной по
 * скорости позиции в пределах диапазона. `velocity` — страниц в секунду,
 * положительная — палец идёт вправо, то есть к предыдущему месяцу.
 */
export const resolveSwipeTarget = (
  page: number,
  velocity: number,
  range: ISlideRange,
): number => {
  "worklet";
  const projected = page - velocity * SWIPE_VELOCITY_TOSS;

  return Math.min(range.max, Math.max(range.min, Math.round(projected)));
};

/** Высота контейнера на дробной странице — линейно между смонтированными страницами (`stops` по возрастанию `index`). */
export const interpolatePageHeight = (
  page: number,
  stops: readonly IPageHeightStop[],
): number => {
  "worklet";
  if (stops.length === 0) return 0;

  const first = stops[0]!;
  const last = stops[stops.length - 1]!;

  if (page <= first.index) return first.height;
  if (page >= last.index) return last.height;

  for (let i = 1; i < stops.length; i++) {
    const to = stops[i]!;

    if (page <= to.index) {
      const from = stops[i - 1]!;
      const t = (page - from.index) / (to.index - from.index);

      return from.height + (to.height - from.height) * t;
    }
  }

  return last.height;
};
