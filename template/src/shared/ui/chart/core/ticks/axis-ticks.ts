import type { LinearScale } from "../scale/linear-scale";
import { divideTicks, niceStep, niceTicks, unitMagnitude } from "./nice-ticks";
import { timeTicks, TimeTickUnit } from "./time-ticks";

/**
 * Режим делений оси:
 * - `"nice"` — кратные «круглому» шагу (1, 2, 2.5, 5 × 10ⁿ);
 * - `"divide"` — равные доли домена, включая края;
 * - `"time"` — по календарю (значения — мс): часы, сутки, недели, месяцы, годы;
 * - `"binary"` — «круглые» в единицах 1024ᵏ (байты): 200 КБ, 1 МБ, 2 ГБ.
 */
export type ChartTickMode = "nice" | "divide" | "time" | "binary";

/** Основание единиц режима `"binary"`. */
export const BINARY_BASE = 1024;

/** Сведения о шаге делений — второй аргумент форматтера подписи. */
export interface AxisTickInfo {
  /** Единица шага для `"time"`; иначе `null`. */
  unit: TimeTickUnit | null;
  /** Единица значений: 1024ᵏ для `"binary"`, иначе 1 — одна единица на всю ось. */
  magnitude: number;
  /** Шаг делений (0 — для `"time"`, где шаг календарный). */
  step: number;
}

export interface TickSet extends AxisTickInfo {
  values: number[];
  /** Меняется, только когда меняется набор значений. */
  key: string;
}

/**
 * Деления домена шкалы. `extend` — доля ширины домена, на которую деления
 * строятся за каждым краем: подписи готовы заранее, до въезда в окно
 * (`"divide"` не расширяется — его деления привязаны к краям).
 */
export const computeTicks = (
  scale: LinearScale,
  mode: ChartTickMode,
  count: number,
  extend: number,
): TickSet => {
  "worklet";

  const low = Math.min(scale.d0, scale.d1);
  const high = Math.max(scale.d0, scale.d1);
  const span = high - low;
  let values: number[] = [];
  let unit: TimeTickUnit | null = null;
  let magnitude = 1;
  let step = 0;

  if (Number.isFinite(span) && span > 0 && count > 0) {
    if (mode === "divide") {
      values = divideTicks(low, high, count);
      step = span / count;
    } else {
      const from = low - span * extend;
      const to = high + span * extend;

      if (mode === "time") {
        const ticks = timeTicks(from, to, count, span);

        values = ticks.values;
        unit = ticks.unit;
      } else {
        if (mode === "binary") {
          magnitude = unitMagnitude(
            Math.max(Math.abs(low), Math.abs(high)),
            BINARY_BASE,
          );
        }
        step = niceStep(span / magnitude, count) * magnitude;
        values = niceTicks(from, to, count, span, magnitude);
      }
    }
  }

  const last = values.length - 1;
  const key = `${mode}|${unit ?? ""}|${magnitude}|${values.length}|${
    values[0] ?? ""
  }|${values[last] ?? ""}`;

  return { values, unit, magnitude, step, key };
};
