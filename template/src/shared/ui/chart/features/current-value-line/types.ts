import type { LineDashType } from "../../core/utils/dash-pattern";

export interface CurrentValueLineLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Цвет линии (и фона лейбла, если `labelBackground` не задан). */
  color?: string;
  /** Рисовать горизонтальную линию через текущее значение. `false` — только чип-лейбл. */
  showLine?: boolean;
  /** px */
  strokeWidth?: number;
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  /** Рисовать точку в последней точке данных серии (на конце графика). */
  showDot?: boolean;
  /** px */
  dotRadius?: number;
  /** Цвет заливки точки (по умолчанию — `color`). */
  dotColor?: string;
  /** Цвет обводки точки (без него обводка не рисуется). */
  dotStrokeColor?: string;
  dotStrokeWidth?: number;
  showLabel?: boolean;
  labelPosition?: "left" | "right";
  /** Форматирует последнее значение серии для чипа. */
  formatLabel?: (value: number) => string;
  labelFontSize?: number;
  labelFontFamily?: string;
  /** Цвет фона чипа (по умолчанию — `color`). */
  labelBackground?: string;
  labelTextColor?: string;
  /** Плавно анимировать линию/чип при изменении последнего значения (например, при live-обновлении данных). */
  animate?: boolean;
  /** мс */
  animationDuration?: number;
  /** К какой серии привязать (по умолчанию — первая). */
  seriesId?: string;
}
