export interface RangeLayerProps {
  /** Скрывает слой без размонтирования. */
  visible?: boolean;
  /** Угол области графика для блока статистики. По умолчанию `"top-right"` — не перекрывает тултип в дефолтном `"top-left"`. */
  placement?: "top-left" | "top-right";
  /** Цвет заливки выделенного диапазона. */
  fillColor?: string;
  /** Цвет обводки диапазона. */
  strokeColor?: string;
  /** Толщина обводки (px). */
  strokeWidth?: number;
  /** Размер шрифта статистики. */
  fontSize?: number;
  /** Шрифт статистики. */
  fontFamily?: string;
  /** Цвет текста. */
  textColor?: string;
  /** Цвет фона блока статистики. */
  labelBackground?: string;
}
