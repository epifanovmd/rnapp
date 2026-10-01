/**
 * Категориальная палитра графиков: порядок слотов фиксирован, дальше
 * восьмого — нейтральный серый.
 */
export const CHART_COLORS = [
  "#2965FF",
  "#16A22F",
  "#EB9900",
  "#E40D07",
  "#8B5CF6",
  "#0EA5E9",
  "#EC4899",
  "#14B8A6",
] as const;

export const seriesColor = (index: number): string =>
  CHART_COLORS[index] ?? "#8F8F8F";
