import type { ListMetrics } from "../../model";

/** Видимый диапазон и его буферизованные границы. */
export interface IListRange {
  start: number;
  end: number;
  startBuffered: number;
  endBuffered: number;
}

export interface IVisibleRangeParams {
  metrics: ListMetrics;
  scroll: number;
  scrollLength: number;
  /** Запас отрисовки за пределами вьюпорта, px. */
  drawDistance: number;
}

/** Диапазон пустого списка: видимого нет, буфер тоже. */
export const EMPTY_RANGE: IListRange = {
  start: 0,
  end: -1,
  startBuffered: 0,
  endBuffered: -1,
};

/**
 * Диапазон отрисовки на текущей позиции.
 *
 * Зачем нужен: смонтированы только те элементы, что попали в диапазон, — на
 * этом и держится виртуализация.
 *
 * Какую проблему решает: буфер по обе стороны вьюпорта (`drawDistance`). Без
 * него элемент монтируется ровно в момент появления на экране и успевает
 * показаться неизмеренным — сначала оценочной высотой, потом настоящей. С
 * буфером он смонтирован и измерен заранее, к моменту, когда до него доходит
 * скролл.
 *
 * Видимый диапазон и буферизованный считаются одним проходом: это одни и те же
 * элементы, отличается только условие попадания.
 */
export const computeVisibleRange = ({
  metrics,
  scroll,
  scrollLength,
  drawDistance,
}: IVisibleRangeParams): IListRange => {
  const count = metrics.getCount();

  if (count === 0) return EMPTY_RANGE;

  metrics.flush();

  const scrollBottom = scroll + scrollLength;
  const bufferedTop = scroll - drawDistance;
  const bufferedBottom = scrollBottom + drawDistance;

  const startBuffered = metrics.findIndexAtOffset(Math.max(0, bufferedTop));
  let endBuffered = startBuffered;
  let start = -1;
  let end = -1;

  for (let index = startBuffered; index < count; index++) {
    const position = metrics.getPosition(index);

    if (position > bufferedBottom) break;

    endBuffered = index;

    const itemBottom = position + metrics.getSize(index);

    if (itemBottom > scroll && position < scrollBottom) {
      if (start === -1) start = index;
      end = index;
    }
  }

  // Ни один элемент не пересёк вьюпорт — видимый диапазон пуст, буфер остаётся.
  if (start === -1) {
    return {
      start: startBuffered,
      end: startBuffered - 1,
      startBuffered,
      endBuffered,
    };
  }

  return { start, end, startBuffered, endBuffered };
};
