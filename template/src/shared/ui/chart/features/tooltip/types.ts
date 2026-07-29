import type { DerivedValue } from "react-native-reanimated";

import type { ChartDatum, IChartSeries } from "../../core/types";
import type { SkFont } from "../../core/utils/label-style";

export interface ActiveTooltipPoint {
  series: IChartSeries;
  datum: ChartDatum;
  /** Разрешённый цвет точки (собственный `series.color` либо встроенная палитра по кругу). */
  color: string;
}

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** px. Отступ от точки привязки. */
  offset?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  /** Передаётся в matchFont. */
  fontFamily?: string;
  /** Форматирует строку одной серии (по умолчанию — `"label: value"`). */
  formatRow?: (point: ActiveTooltipPoint) => string;
  /** Привязывать тултип к пиксельной позиции активной точки первой серии, а не к сырой позиции пальца. */
  anchorToPoint?: boolean;
  side?: TooltipSide;
  /** Срабатывает при показе/скрытии тултипа (по `isActive`). */
  onVisibilityChange?: (visible: boolean) => void;
}

export interface TooltipRowProps {
  index: number;
  boxX: DerivedValue<number>;
  boxY: DerivedValue<number>;
  text: string;
  dotColor: string;
  font: SkFont;
  fontSize: number;
  textColor: string;
  paddingX: number;
  paddingY: number;
  rowHeight: number;
  dotRadius: number;
}
