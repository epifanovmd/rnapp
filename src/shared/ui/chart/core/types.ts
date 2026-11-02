import type { FC, ReactNode } from "react";

import type { ChartGestureContextValue } from "./context";
import type { ChartYDomainResolver } from "./scale/y-domain";
import type { ChartViewport } from "./viewport/useChartViewport";

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

/** Область построения (px) — канвас за вычетом отступов. */
export interface ChartPlotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/** Жесты навигации по окну (`Chart.zoom`). */
export interface ChartZoomOptions {
  /** Прокрутка окна одним пальцем. По умолчанию `true`. */
  pan?: boolean;
  /** Зум двумя пальцами вокруг точки между ними. По умолчанию `true`. */
  pinch?: boolean;
  /** Двойной тап — приблизить в точку; на минимальной ширине — сброс. По умолчанию `true`. */
  doubleTap?: boolean;
  /** Во сколько раз приближает двойной тап. По умолчанию 2. */
  doubleTapFactor?: number;
  /** Инерция прокрутки после отпускания. По умолчанию `true`. */
  inertia?: boolean;
  /** Через сколько мс удержания появляется перекрестие. По умолчанию 250. */
  inspectDelay?: number;
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
  /**
   * Домен оси Y: `[min, max]` — фиксированный; функция-worklet — из экстента
   * видимых точек; без него — авто-домен по видимым точкам (`beginAtZero`,
   * `yPaddingRatio`, `yNice`).
   */
  yDomain?: [number, number] | ChartYDomainResolver;
  /** Включать 0 в авто-домен Y. */
  beginAtZero?: boolean;
  /** Округлять края авто-домена Y до «круглого» шага при таком числе делений; `false` — без округления. По умолчанию 5. */
  yNice?: number | false;
  /** Анимировать смену домена Y (окно, live-данные). По умолчанию `true`. */
  animateYDomain?: boolean;
  /**
   * Окно просмотра по X (`useChartViewport`): программная смена, пресеты,
   * навигатор, синхронизация графиков. Без него — внутреннее окно на все данные.
   */
  viewport?: ChartViewport;
  /**
   * Жесты навигации: прокрутка, зум двумя пальцами, двойной тап. Перекрестие
   * и тултип при этом — по долгому нажатию. По умолчанию выключены.
   */
  zoom?: boolean | ChartZoomOptions;
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
  /**
   * Режим двух пальцев: второй палец получает свою активную точку (`activeIndices2`) —
   * второй кроссхейр, диапазон `RangeLayer`, данные обеих точек в `TooltipLayer` и
   * `onChange(primary, secondary)`. По умолчанию `false` — учитывается только первый палец.
   */
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
  viewport: ChartViewport;
  xDomain?: [number, number];
  yDomain?: [number, number] | ChartYDomainResolver;
  beginAtZero?: boolean;
  yNice?: number | false;
  animateYDomain?: boolean;
  xPaddingRatio?: number;
  yPaddingRatio?: number;
  xReverse?: boolean;
  yReverse?: boolean;
  onChange?: (
    primary: ActivePoint[] | null,
    secondary: ActivePoint[] | null,
  ) => void;
}
