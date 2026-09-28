import type { FC, ReactNode } from "react";

import type { ChartGestureContextValue } from "./context";

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
  /** Цвет серии — задаётся явно, авто-палитры по индексу нет. */
  color: string;
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
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: ChartPadding;
  /** Ширина рабочей области за вычетом отступов (px). */
  plotWidth: number;
  /** Высота рабочей области за вычетом отступов (px). */
  plotHeight: number;
}

/** Слой-компонент, рендерящийся внутри `<Chart>` (как `children`) или в `overlay`. */
export type ChartLayerComponent<P = any> = FC<P>;

/** Пиксельная точка (после применения `xScale`/`yScale`). */
export interface PixelPoint {
  x: number;
  y: number;
}

/** Активная (ближайшая к касанию) точка одной серии — см. `Chart.onChange`. */
export interface ActivePoint {
  series: IChartSeries;
  /** Ближайшая точка данных. */
  datum: ChartDatum;
}

export interface ChartProps {
  /** Серии данных для отрисовки; также определяют авто-домены x/y, если `xDomain`/`yDomain` не заданы. */
  series: IChartSeries[];
  /** Фиксированная ширина (px); без неё ширина измеряется через `onLayout` (растягивается на родителя). */
  width?: number;
  /** Высота графика (px). По умолчанию 220. */
  height?: number;
  /** Отступы вокруг рабочей зоны. Мёржится с дефолтом. */
  padding?: Partial<ChartPadding>;
  /** Фиксированный домен оси X `[min, max]`; без него вычисляется из данных `series`. */
  xDomain?: [number, number];
  /** Фиксированный домен оси Y `[min, max]`; без него вычисляется из данных `series`. */
  yDomain?: [number, number];
  /** Включать 0 в авто-домен Y. */
  beginAtZero?: boolean;
  /** Доп. запас по краям авто-домена X, в долях от его размаха. */
  xPaddingRatio?: number;
  /** Доп. запас по краям авто-домена Y, в долях от его размаха. */
  yPaddingRatio?: number;
  /** Зеркалит график по горизонтали. */
  xReverse?: boolean;
  /** Зеркалит график по вертикали. */
  yReverse?: boolean;
  /** Включает жест pan (кроссхейр, тултип, события нажатия). `false` — статичный/read-only график. */
  interactive?: boolean;
  /** Минимальное смещение (px) для активации pan. */
  panActivationDistance?: number;
  /** Диапазон (px) активации pan по X; по умолчанию `[-8, 8]`. */
  panActiveOffsetX?: number | [number, number];
  /** Диапазон (px) сброса pan в пользу родительского скролла; по умолчанию `[-8, 8]`. */
  panFailOffsetY?: number | [number, number];
  /** Включить второе касание (для второго кроссхейра). */
  twoFingerEnabled?: boolean;
  /** Срабатывает при начале/окончании (первого) касания. */
  onActiveChange?: (active: boolean) => void;
  /** Вызывается при смене активных точек; первый аргумент — первое касание, второй — второе. */
  onChange?: (
    primary: ActivePoint[] | null,
    secondary: ActivePoint[] | null,
  ) => void;
  /** Слои графика (Grid, Line, Area, Axis и т.д.). */
  children?: ReactNode;
}

/** Пропсы `<ChartProvider>`. */
export interface ChartProviderProps {
  series: IChartSeries[];
  dimensions: ChartDimensions;
  interaction: ChartGestureContextValue;
  xDomain?: [number, number];
  yDomain?: [number, number];
  beginAtZero?: boolean;
  xPaddingRatio?: number;
  yPaddingRatio?: number;
  xReverse?: boolean;
  yReverse?: boolean;
  onChange?: (
    primary: ActivePoint[] | null,
    secondary: ActivePoint[] | null,
  ) => void;
}
