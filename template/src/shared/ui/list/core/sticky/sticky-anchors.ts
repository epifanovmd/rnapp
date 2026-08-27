import type { ListMetrics } from "../../model";
import type { IListStickyConfig, ListStickyEdge } from "../../types";
import { getStickyEdgeOf, getStickyLimitOf } from "./sticky-limits";
import { getPinnedStickyIndices } from "./sticky-pinning";

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

/**
 * Выбор активных прилипающих элементов.
 *
 * Зачем нужен: на каждой кромке прилипшим может быть ровно один элемент — тот,
 * что её пересекает. Для начальной кромки это последний элемент, ушедший за неё
 * вверх; для конечной — первый, чей низ оказался ниже неё.
 *
 * Какую проблему решает: отделяет выбор якоря (JS, на пересчёте раскладки) от
 * его смещения (worklet, на каждом кадре скролла). Активный якорь меняется
 * редко — на границах групп, — а смещение считается непрерывно, и считать их
 * вместе значило бы гонять пересчёт диапазона на каждом кадре.
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
    return getStickyEdgeOf(this.configs, index);
  }

  /** Предел смещения якоря; см. {@link getStickyLimitOf}. */
  getLimitOf(index: number): number | undefined {
    return getStickyLimitOf(this.configs, this.options.metrics, index);
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

  /** Последний якорь, ушедший за начальную кромку. */
  private resolveStart(
    config: IListStickyConfig,
    scroll: number,
  ): IStickyState {
    const { metrics } = this.options;
    const { indices } = config;
    const edgePosition = scroll + (config.offset?.value ?? 0);

    for (let i = indices.length - 1; i >= 0; i--) {
      const activeIndex = indices[i]!;

      if (metrics.getPosition(activeIndex) > edgePosition) continue;

      return {
        edge: "start",
        activeIndex,
        limit: this.getLimitOf(activeIndex),
      };
    }

    return { edge: "start", activeIndex: -1, limit: undefined };
  }

  /** Первый якорь, чей низ оказался ниже конечной кромки. */
  private resolveEnd(
    config: IListStickyConfig,
    scroll: number,
    scrollLength: number,
  ): IStickyState {
    const { metrics } = this.options;
    const { indices } = config;
    const edgePosition = scroll + scrollLength - (config.offset?.value ?? 0);

    for (const activeIndex of indices) {
      const bottom =
        metrics.getPosition(activeIndex) + metrics.getSize(activeIndex);

      if (bottom <= edgePosition) continue;

      return { edge: "end", activeIndex, limit: this.getLimitOf(activeIndex) };
    }

    return { edge: "end", activeIndex: -1, limit: undefined };
  }

  /** Индексы, которые нужно держать смонтированными вне буфера отрисовки. */
  getPinnedIndices(states: IStickyState[]): number[] {
    return getPinnedStickyIndices(this.configs, states);
  }
}
