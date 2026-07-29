/** Общие пропсы для `AxisLayerX` и `AxisLayerY`. */
export interface AxisLayerBaseProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Примерное число подписей/делений (через `scale.ticks()`). */
  tickCount?: number;
  /** Форматирует значение деления в текст подписи (даты, проценты и т.п.). */
  formatLabel?: (value: number) => string;
  /** Цвет линий делений. */
  color?: string;
  /** Рисовать основную линию оси. */
  showAxisLine?: boolean;
  /** Толщина линии оси (px). */
  lineWidth?: number;
  /** Цвет текста подписей. */
  labelColor?: string;
  /** Размер шрифта подписей. */
  fontSize?: number;
  /** Шрифт подписей (передаётся в `matchFont`). */
  fontFamily?: string;
  /** Рисовать засечки делений. */
  showTicks?: boolean;
  /** Длина засечек (px). */
  tickLength?: number;
}
