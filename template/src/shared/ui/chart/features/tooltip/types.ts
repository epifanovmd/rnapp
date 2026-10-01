import type { DerivedValue } from "react-native-reanimated";

import type { ChartDatum, IChartSeries } from "../../core/types";
import type { SkFont } from "../../core/utils/label-style";

export interface ActiveTooltipPoint {
  series: IChartSeries;
  datum: ChartDatum;
  /** Разрешённый цвет точки (собственный `series.color` либо встроенная палитра по кругу). */
  color: string;
  /** Каким пальцем выбрана точка: `"primary"` — первым, `"secondary"` — вторым (`Chart.twoFingerEnabled`). */
  touch: "primary" | "secondary";
}

/**
 * Расположение тултипа во время касания:
 * - `"top-left"` / `"top-right"` — закреплён в верхнем углу области графика (внутри `padding`);
 * - `"follow"` — следует за пальцем/точкой (`side`, `offset`, `anchorToPoint`), прижимаясь к краям.
 */
export type TooltipPlacement = "top-left" | "top-right" | "follow";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Расположение тултипа. По умолчанию `"top-left"`. */
  placement?: TooltipPlacement;
  /** px. Отступ от точки привязки (только `placement="follow"`). */
  offset?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  /** Передаётся в matchFont. */
  fontFamily?: string;
  /** Форматирует строку одной серии (по умолчанию — `"label: value"`). */
  formatRow?: (point: ActiveTooltipPoint) => string;
  /** Привязывать тултип к пиксельной позиции активной точки первой серии, а не к сырой позиции пальца (только `placement="follow"`). */
  anchorToPoint?: boolean;
  /** Сторона от точки привязки (только `placement="follow"`). */
  side?: TooltipSide;
  /** При двух пальцах (`Chart.twoFingerEnabled`) показывать строки обеих точек, слева направо. По умолчанию `true`. */
  showSecondTouch?: boolean;
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
