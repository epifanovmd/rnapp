import type { ChartTickMode } from "../../core/ticks/axis-ticks";
import type { LineDashType } from "../../core/utils/dash-pattern";

export interface GridLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Сколько вертикальных линий помещается в окно (не больше). */
  xTickCount?: number;
  /** Сколько горизонтальных линий помещается в домен (не больше). */
  yTickCount?: number;
  /** Деления по X — как у `AxisLayerX.ticks`, чтобы линии совпали с подписями. */
  xTicks?: ChartTickMode;
  /** Деления по Y — как у `AxisLayerY.ticks`. */
  yTicks?: ChartTickMode;
  showXLines?: boolean;
  showYLines?: boolean;
  color?: string;
  /** px */
  strokeWidth?: number;
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
}
