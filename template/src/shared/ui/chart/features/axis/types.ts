/** Общие пропсы для `AxisLayerX` и `AxisLayerY`. */
export interface AxisLayerBaseProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Примерное число подписей/делений (через `scale.ticks()`). */
  tickCount?: number;
  /** Форматирует значение деления в текст подписи (даты, проценты и т.п.). */
  formatLabel?: (value: number) => string;
  color?: string;
  showAxisLine?: boolean;
  /** px */
  lineWidth?: number;
  labelColor?: string;
  fontSize?: number;
  /** Передаётся в matchFont. */
  fontFamily?: string;
  showTicks?: boolean;
  /** px */
  tickLength?: number;
}
