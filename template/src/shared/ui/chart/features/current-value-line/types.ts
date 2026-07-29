import type { LineDashType } from "../../core/utils/dash-pattern";

export interface CurrentValueLineLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Цвет линии (и фона лейбла, если `labelBackground` не задан). */
  color?: string;
  /** Рисовать горизонтальную линию через текущее значение. `false` — только чип-лейбл. */
  showLine?: boolean;
  /** Толщина линии (px). */
  strokeWidth?: number;
  /** Сплошная, пунктирная или точечная линия. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  /** Рисовать точку в последней точке данных серии (на конце графика). */
  showDot?: boolean;
  /** Радиус точки (px). */
  dotRadius?: number;
  /** Цвет заливки точки (по умолчанию — `color`). */
  dotColor?: string;
  /** Цвет обводки точки (без него обводка не рисуется). */
  dotStrokeColor?: string;
  /** Толщина обводки точки (px). */
  dotStrokeWidth?: number;
  /** Показывать чип со значением у края графика. */
  showLabel?: boolean;
  /** С какой стороны рисовать чип со значением. */
  labelPosition?: "left" | "right";
  /** Форматирует последнее значение серии для чипа. */
  formatLabel?: (value: number) => string;
  /** Размер шрифта чипа. */
  labelFontSize?: number;
  /** Шрифт чипа. */
  labelFontFamily?: string;
  /** Цвет фона чипа (по умолчанию — `color`). */
  labelBackground?: string;
  /** Цвет текста чипа. */
  labelTextColor?: string;
  /** Плавно анимировать линию/чип при изменении последнего значения (например, при live-обновлении данных). */
  animate?: boolean;
  /** Длительность анимации перехода (мс). */
  animationDuration?: number;
  seriesId?: string;
}
