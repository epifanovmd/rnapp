import type { LineDashType } from "../../core/utils/dash-pattern";

export interface GridLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Примерное число вертикальных линий сетки (через `xScale.ticks()`). */
  xTickCount?: number;
  /** Примерное число горизонтальных линий сетки (через `yScale.ticks()`). */
  yTickCount?: number;
  showXLines?: boolean;
  showYLines?: boolean;
  color?: string;
  /** px */
  strokeWidth?: number;
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
}
