import type { DerivedValue } from "react-native-reanimated";

import type { ChartDatum, IChartSeries } from "../../core/types";
import type { SkFont } from "../../core/utils/label-style";

export interface ActiveTooltipPoint {
  /** Серия, которой принадлежит точка. */
  series: IChartSeries;
  /** Активная точка данных этой серии. */
  datum: ChartDatum;
  /** Разрешённый цвет точки (собственный `series.color` либо встроенная палитра по кругу). */
  color: string;
}

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Отступ (px) между точкой привязки и краем тултипа. */
  offset?: number;
  /** Цвет фона тултипа. */
  backgroundColor?: string;
  /** Цвет текста строк. */
  textColor?: string;
  /** Размер шрифта. */
  fontSize?: number;
  /** Шрифт (передаётся в `matchFont`). */
  fontFamily?: string;
  /** Форматирует строку одной серии (по умолчанию — `"label: value"`). */
  formatRow?: (point: ActiveTooltipPoint) => string;
  /** Привязывать тултип к пиксельной позиции активной точки первой серии, а не к сырой позиции пальца. */
  anchorToPoint?: boolean;
  /** С какой стороны от точки привязки показывать тултип. */
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
