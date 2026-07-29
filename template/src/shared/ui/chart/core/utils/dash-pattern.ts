/** Типы линий для пунктирных пресетов. */
export type LineDashType =
  "solid" | "dashed" | "dotted" | "dash-dot" | "long-dash" | "short-dash";

/** Словарь пресетов: имя -> массив чередований [draw, gap, ...] или undefined (сплошная). */
export const DASH_PRESETS: Record<LineDashType, number[] | undefined> = {
  solid: undefined,
  dashed: [6, 4],
  dotted: [1, 3],
  "dash-dot": [6, 3, 1, 3],
  "long-dash": [10, 5],
  "short-dash": [4, 3],
};
