import type { LineDashType } from "../../core/utils/dash-pattern";

export interface GridLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Примерное число вертикальных линий сетки (через `xScale.ticks()`). */
  xTickCount?: number;
  /** Примерное число горизонтальных линий сетки (через `yScale.ticks()`). */
  yTickCount?: number;
  /** Рисовать вертикальные линии. */
  showXLines?: boolean;
  /** Рисовать горизонтальные линии. */
  showYLines?: boolean;
  /** Цвет линий. */
  color?: string;
  /** Толщина линий (px). */
  strokeWidth?: number;
  /** Сплошная, пунктирная или точечная линия. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
}
