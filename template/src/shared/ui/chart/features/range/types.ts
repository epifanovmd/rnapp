export interface RangeLayerProps {
  /** Скрывает слой без размонтирования. */
  visible?: boolean;
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
