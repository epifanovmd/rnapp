import type { LinearScale } from "../scale/linear-scale";
import { divideTicks, niceTicks } from "./nice-ticks";
import { timeTicks, TimeTickUnit } from "./time-ticks";

/**
 * Режим делений оси:
 * - `"nice"` — кратные «круглому» шагу (1, 2, 2.5, 5 × 10ⁿ);
 * - `"divide"` — равные доли домена, включая края;
 * - `"time"` — по календарю (значения — мс): часы, сутки, недели, месяцы, годы.
 */
export type ChartTickMode = "nice" | "divide" | "time";

export interface TickSet {
  values: number[];
  /** Единица шага для `"time"`; иначе `null`. */
  unit: TimeTickUnit | null;
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

  if (Number.isFinite(span) && span > 0 && count > 0) {
    if (mode === "divide") {
      values = divideTicks(low, high, count);
    } else {
      const from = low - span * extend;
      const to = high + span * extend;

      if (mode === "time") {
        const ticks = timeTicks(from, to, count, span);

        values = ticks.values;
        unit = ticks.unit;
      } else {
        values = niceTicks(from, to, count, span);
      }
    }
  }

  const last = values.length - 1;
  const key = `${mode}|${unit ?? ""}|${values.length}|${values[0] ?? ""}|${
    values[last] ?? ""
  }`;

  return { values, unit, key };
};
