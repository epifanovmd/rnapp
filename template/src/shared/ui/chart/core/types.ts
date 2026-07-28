import type { FC } from "react";

export interface ChartDatum {
  /** Значение по оси X (доменные координаты, не пиксели). */
  x: number;
  /** Значение по оси Y (доменные координаты, не пиксели). */
  y: number;
  /** Текстовая подпись точки (даты, категории и т.п.) — используется форматтерами осей/тултипа/кроссхейра. */
  label?: string;
  /** Произвольные данные консьюмера, не используются самим движком. */
  meta?: unknown;
}

export interface IChartSeries {
  /** Уникальный id серии (React key, используется `SeriesSelector`). */
  id: string;
  /** Название серии (для легенды/тултипа). */
  label?: string;
  /** Свой цвет серии; если не задан — берётся из `colors` слоя по кругу. */
  color?: string;
  /** Точки данных серии. */
  data: ChartDatum[];
}

export interface IScale {
  /** Диапазон значений на входе (доменные координаты). */
  readonly domain: [number, number];
  /** Диапазон значений на выходе (пиксели). */
  readonly range: [number, number];
  /** Домен → пиксель. */
  toRange(value: number): number;
  /** Пиксель → домен. */
  toDomain(value: number): number;
  /** Значения делений для сетки/осей. */
  ticks(count?: number): number[];
}

export interface ChartPadding {
  /** Отступ сверху (px). */
  top: number;
  /** Отступ справа (px). */
  right: number;
  /** Отступ снизу (px). */
  bottom: number;
  /** Отступ слева (px). */
  left: number;
}

export interface ChartDimensions {
  /** Полная ширина канваса (px). */
  width: number;
  /** Полная высота канваса (px). */
  height: number;
  /** Отступы вокруг рабочей области. */
  padding: ChartPadding;
  /** Ширина рабочей области за вычетом отступов (px). */
  plotWidth: number;
  /** Высота рабочей области за вычетом отступов (px). */
  plotHeight: number;
}

/** `"skia"` — рисуется внутри `<Canvas>`; `"overlay"` — обычный RN-View поверх канваса. */
export type ChartLayerKind = "skia" | "overlay";

export type ChartLayerComponent<P = any> = FC<P> & {
  layerKind?: ChartLayerKind;
};
