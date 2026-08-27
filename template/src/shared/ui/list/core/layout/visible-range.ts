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
  /** Скорость скролла, px/мс: положительная — к концу списка. */
  velocity?: number;
}

/**
 * На сколько вперёд смотреть по скорости, мс.
 *
 * Это запас на задержку: событие скролла, пересчёт, рендер и монтирование
 * занимают несколько кадров, и на броске контент за это время уходит дальше
 * буфера. Величина покрывает эту задержку с запасом.
 */
const LOOKAHEAD_MS = 220;

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
 * На броске одного буфера мало: пока событие скролла дойдёт до пересчёта, а
 * новые строки отрисуются и смонтируются, контент уходит дальше него — в кадре
 * остаётся пустая полоса. Поэтому по ходу движения буфер растёт со скоростью, и
 * тем сильнее, чем быстрее скролл; назад он не растёт, там всё уже отрисовано.
 *
 * Выше некоторой скорости буфер перестаёт окупаться и начинает вредить:
 * смонтировать он успевает меньше, чем контент проходит за тот же проход, — см.
 * {@link isOverrunning}. Тогда рисуется только сам вьюпорт: проход становится
 * втрое дешевле, и на экране оказывается то, куда пользователь смотрит сейчас,
 * а не то, мимо чего он пролетел.
 *
 * Видимый диапазон и буферизованный считаются одним проходом: это одни и те же
 * элементы, отличается только условие попадания.
 */
export const computeVisibleRange = ({
  metrics,
  scroll,
  scrollLength,
  drawDistance,
  velocity = 0,
}: IVisibleRangeParams): IListRange => {
  const count = metrics.getCount();

  if (count === 0) return EMPTY_RANGE;

  const scrollBottom = scroll + scrollLength;
  const overrunning = isOverrunning(velocity, scrollLength);
  const buffer = overrunning ? 0 : drawDistance;
  // Запас растёт только по ходу движения: позади он и так уже отрисован, а
  // впереди именно его не хватает.
  const lookahead = overrunning ? 0 : getLookahead(velocity, scrollLength);
  const bufferedTop = scroll - buffer - Math.max(0, -lookahead);
  const bufferedBottom = scrollBottom + buffer + Math.max(0, lookahead);

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

/**
 * Потолок запаса — в экранах.
 *
 * Без потолка резкий бросок уводит запас в тысячи пикселей, а это сотни
 * смонтированных строк: список начнёт тормозить ровно там, где должен успевать.
 * Два экрана — компромисс по замерам: на настоящем броске события скролла
 * доходят до пересчёта раз в несколько кадров, и одного экрана на эту задержку
 * не хватает.
 */
const LOOKAHEAD_SCREENS = 3;

/**
 * Скорость, за которой запас отрисовки не поспевает, — в экранах за миллисекунду.
 *
 * Замеры на устройстве: до трети экрана в мс список держит 56–60 кадров и рисует
 * без пустот — запас окупается. На скрабе полосой скорость доходит до 0.6, и там
 * проход уже не успевает смонтировать даже то, мимо чего пользователь пролетел:
 * кадры растягиваются до сотен миллисекунд, а вьюпорт стоит пустой. Порог взят
 * между этими двумя режимами.
 */
const OVERRUN_SCREENS_PER_MS = 0.45;

/** Контент идёт быстрее, чем проход успевает его смонтировать. */
export const isOverrunning = (
  velocity: number,
  scrollLength: number,
): boolean =>
  scrollLength > 0 &&
  Math.abs(velocity) > scrollLength * OVERRUN_SCREENS_PER_MS;

/** Запас по ходу движения, px. Знак повторяет знак скорости. */
const getLookahead = (velocity: number, scrollLength: number): number => {
  const distance = velocity * LOOKAHEAD_MS;
  const limit = scrollLength * LOOKAHEAD_SCREENS;

  return Math.max(-limit, Math.min(limit, distance));
};
