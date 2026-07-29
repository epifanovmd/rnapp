import type { DerivedValue, SharedValue } from "react-native-reanimated";

import type { ChartDimensions, IChartSeries, PixelPoint } from "../../core";
import type { LineDashType } from "../../core/utils/dash-pattern";
import type { SkFont } from "../../core/utils/label-style";

export interface CrosshairLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Цвет вертикальной линии (и второй линии, если `secondLineColor` не задан). */
  color?: string;
  /** Толщина линий (px). */
  strokeWidth?: number;
  /** Радиус маркера в активной точке каждой серии. */
  markerRadius?: number;
  showMarkers?: boolean;
  showVerticalLine?: boolean;
  /** Горизонтальные линии на уровне активного значения каждой серии. */
  showHorizontalLines?: boolean;
  /** Цвет горизонтальных линий (по умолчанию — `color`). */
  horizontalLineColor?: string;
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  showXLabel?: boolean;
  /** С какой стороны рисовать чип X (независимо от `position` у `AxisLayer`). */
  xLabelPosition?: "top" | "bottom";
  /** Форматирует значение X для чипа. */
  xLabelFormatter?: (value: number) => string;
  showYLabels?: boolean;
  /** С какой стороны рисовать чипы Y (независимо от `position` у `AxisLayer`). */
  yLabelPosition?: "left" | "right";
  /** Форматирует значение Y для чипа конкретной серии. */
  yLabelFormatter?: (value: number, series: IChartSeries) => string;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelBackground?: string;
  labelTextColor?: string;
  /** Рисовать вторую линию, пока активно второе касание (нужен `Chart.twoFingerEnabled`). */
  showSecondTouch?: boolean;
  /** Цвет второй линии/чипов (по умолчанию — как у первой, `color`). */
  secondLineColor?: string;
}

export interface CrosshairLineProps {
  series: IChartSeries[];
  dimensions: ChartDimensions;
  /** { seriesId -> PixelPoint[] }. */
  geometry: DerivedValue<Record<string, PixelPoint[]>>;
  touchX: SharedValue<number>;
  active: SharedValue<boolean>;
  activeIndices: DerivedValue<number[]>;
  color: string;
  strokeWidth: number;
  markerRadius: number;
  showVerticalLine: boolean;
  showMarkers: boolean;
  showHorizontalLines: boolean;
  horizontalLineColor?: string;
  dashIntervals?: number[];
  showXLabel: boolean;
  xLabelPosition: "top" | "bottom";
  xLabelFormatter: (value: number) => string;
  showYLabels: boolean;
  yLabelPosition: "left" | "right";
  yLabelFormatter: (value: number, series: IChartSeries) => string;
  font: SkFont;
  fontSize: number;
  labelBackground: string;
  labelTextColor: string;
}

export interface CrosshairSeriesIndicatorProps {
  series: IChartSeries;
  seriesIndex: number;
  activeIndices: DerivedValue<number[]>;
  geometry: DerivedValue<Record<string, PixelPoint[]>>;
  color: string;
  radius: number;
  strokeWidth: number;
  dashIntervals?: number[];
  left: number;
  right: number;
  canvasWidth: number;
  showMarker: boolean;
  showHorizontalLine: boolean;
  horizontalLineColor?: string;
  showLabel: boolean;
  labelPosition: "left" | "right";
  labelFormatter: (value: number, series: IChartSeries) => string;
  font: SkFont;
  fontSize: number;
  labelBackground: string;
  labelTextColor: string;
}

export interface CrosshairXLabelProps {
  anchorX: SharedValue<number>;
  edgeY: number;
  position: "top" | "bottom";
  text: string;
  font: SkFont;
  fontSize: number;
  background: string;
  textColor: string;
}

export interface CrosshairYLabelProps {
  anchorPoint: SharedValue<{ x: number; y: number }>;
  edgeX: number;
  canvasWidth: number;
  position: "left" | "right";
  text: string;
  font: SkFont;
  fontSize: number;
  background: string;
  textColor: string;
}
