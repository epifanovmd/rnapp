import type { AxisTickInfo, ChartTickMode } from "../../core";

/** Общие пропсы для `AxisLayerX` и `AxisLayerY`. */
export interface AxisLayerBaseProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Сколько делений помещается в видимое окно (не больше). */
  tickCount?: number;
  /**
   * Как строить деления. По умолчанию `"nice"`; для времени (мс) — `"time"`;
   * для байтов — `"binary"` (шаг круглый в КБ/МБ/ГБ).
   */
  ticks?: ChartTickMode;
  /**
   * Текст подписи деления; второй аргумент — единица и шаг делений (`unit`
   * для `"time"`, `magnitude` — общая единица значений оси). Обычная
   * JS-функция — вызывается при смене набора делений. Для `"time"` по
   * умолчанию — `formatTimeTick`.
   */
  formatLabel?: (value: number, tick: AxisTickInfo) => string;
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
  /** С какой стороны от оси рисовать подписи: внутрь графика или наружу. */
  labelSide?: "in" | "out";
  /** Цвет фона подписи (без него — без фона). */
  labelBackground?: string;
  /** Цвет фона оси (прозрачный по умолчанию). */
  background?: string;
}
