import type { ListMetrics } from "../model";
import type { IListStickyConfig, ListStickyEdge } from "../types";

export interface IStickyAnchorsOptions {
  metrics: ListMetrics;
}

/** Активный якорь кромки и границы его хода. */
export interface IStickyState {
  edge: ListStickyEdge;
  /** Индекс прилипшего элемента; -1 — на этой кромке никто не прилип. */
  activeIndex: number;
  /**
   * Предел смещения: для начальной кромки — куда якорь выталкивает следующий,
   * для конечной — верх собственной группы, выше которого подниматься нельзя.
   */
  limit: number | undefined;
}

/** Соседей активного якоря держим смонтированными по обе стороны. */
const NEIGHBOUR_RADIUS = 1;

/**
 * Прилипающие элементы.
 *
 * На каждой кромке активен ровно один якорь — тот, что её пересекает. Для
 * начальной кромки это последний элемент, ушедший за неё вверх; для конечной —
 * первый, чей низ оказался ниже неё.
 *
 * Ход якоря ограничен соседом: на начальной кромке следующий якорь выталкивает
 * текущий вверх, на конечной подъём упирается в верх собственной группы —
 * элемент, идущий сразу за предыдущим якорем.
 */
export class StickyAnchors {
  private readonly options: IStickyAnchorsOptions;
  private configs: IListStickyConfig[] = [];

  constructor(options: IStickyAnchorsOptions) {
    this.options = options;
  }

  setConfigs(configs: IListStickyConfig[] | undefined): void {
    this.configs = configs ?? [];
  }

  hasAnchors(): boolean {
    return this.configs.some(config => config.indices.length > 0);
  }

  /** Является ли элемент якорем, и на какой кромке. */
  getEdgeOf(index: number): ListStickyEdge | null {
    for (const config of this.configs) {
      if (config.indices.includes(index)) return config.edge;
    }

    return null;
  }

  /**
   * Предел смещения якоря.
   *
   * Зависит только от геометрии соседних якорей, но не от позиции скролла:
   * иначе значение менялось бы на каждом кадре прокрутки и дёргало worklet.
   *
   * Считается для каждого якоря, а не только для активного: без предела
   * соседние якоря липнут к кромке наравне с ним и накладываются друг на друга.
   */
  getLimitOf(index: number): number | undefined {
    const { metrics } = this.options;

    for (const config of this.configs) {
      const arrayIndex = config.indices.indexOf(index);

      if (arrayIndex === -1) continue;

      if (config.edge === "start") {
        const nextIndex = config.indices[arrayIndex + 1];

        // Следующий якорь подъезжает снизу и выталкивает текущий за кромку.
        return nextIndex === undefined
          ? undefined
          : metrics.getPosition(nextIndex) - metrics.getSize(index);
      }

      // Начало группы, если оно объявлено явно.
      const groupStart = config.groupStarts?.[arrayIndex];

      if (groupStart !== undefined) {
        return metrics.getPosition(groupStart) + (config.limitInset ?? 0);
      }

      const previousIndex = config.indices[arrayIndex - 1];

      // Иначе — строка сразу за предыдущим якорем.
      return metrics.getPosition(
        previousIndex === undefined ? 0 : previousIndex + 1,
      );
    }

    return undefined;
  }

  /**
   * Активные якоря на текущей позиции скролла.
   *
   * `edgeOffset` — отступ кромки: сверху навбар, снизу панель ввода. Здесь
   * берётся его последнее значение с UI-потока, точное положение доводится
   * в worklet.
   */
  resolve(scroll: number, scrollLength: number): IStickyState[] {
    return this.configs.map(config =>
      config.edge === "start"
        ? this.resolveStart(config, scroll)
        : this.resolveEnd(config, scroll, scrollLength),
    );
  }

  private resolveStart(
    config: IListStickyConfig,
    scroll: number,
  ): IStickyState {
    const { metrics } = this.options;
    const { indices } = config;
    const edgePosition = scroll + (config.offset?.value ?? 0);

    let activeArrayIndex = -1;

    for (let i = indices.length - 1; i >= 0; i--) {
      const position = metrics.getPosition(indices[i]!);

      if (position <= edgePosition) {
        activeArrayIndex = i;
        break;
      }
    }

    if (activeArrayIndex === -1) {
      return { edge: "start", activeIndex: -1, limit: undefined };
    }

    const activeIndex = indices[activeArrayIndex]!;
    const nextIndex = indices[activeArrayIndex + 1];
    // Следующий якорь подъезжает снизу и выталкивает текущий.
    const limit =
      nextIndex === undefined
        ? undefined
        : metrics.getPosition(nextIndex) - metrics.getSize(activeIndex);

    return { edge: "start", activeIndex, limit };
  }

  private resolveEnd(
    config: IListStickyConfig,
    scroll: number,
    scrollLength: number,
  ): IStickyState {
    const { metrics } = this.options;
    const { indices } = config;
    const edgePosition = scroll + scrollLength - (config.offset?.value ?? 0);

    let activeArrayIndex = -1;

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i]!;
      const bottom = metrics.getPosition(index) + metrics.getSize(index);

      if (bottom > edgePosition) {
        activeArrayIndex = i;
        break;
      }
    }

    if (activeArrayIndex === -1) {
      return { edge: "end", activeIndex: -1, limit: undefined };
    }

    const activeIndex = indices[activeArrayIndex]!;

    return { edge: "end", activeIndex, limit: this.getLimitOf(activeIndex) };
  }

  /**
   * Индексы, которые нужно держать смонтированными вне буфера отрисовки:
   * активный якорь каждой кромки и его ближайшие соседи по набору.
   */
  getPinnedIndices(states: IStickyState[]): number[] {
    const pinned: number[] = [];

    for (const state of states) {
      if (state.activeIndex === -1) continue;

      const config = this.configs.find(item => item.edge === state.edge);

      if (!config) continue;

      const arrayIndex = config.indices.indexOf(state.activeIndex);

      for (
        let offset = -NEIGHBOUR_RADIUS;
        offset <= NEIGHBOUR_RADIUS;
        offset++
      ) {
        const index = config.indices[arrayIndex + offset];

        if (index !== undefined && !pinned.includes(index)) pinned.push(index);
      }
    }

    return pinned;
  }
}
