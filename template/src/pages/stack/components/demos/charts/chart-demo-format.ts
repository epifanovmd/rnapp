import type { ActivePoint, ChartRangePreset } from "@shared/ui/chart";

import { REVENUE_VS_EXPENSES } from "./chart-mock-data";

export const peakRevenue = REVENUE_VS_EXPENSES[0].data.reduce((best, datum) =>
  datum.y > best.y ? datum : best,
);

export const formatTooltipRow = (point: {
  series: { label?: string };
  datum: { x: number; y: number; label?: string };
}) => {
  const label = point.datum.label
    ? `${point.datum.y} (${point.datum.label})`
    : `${point.datum.y}`;

  return `${point.series.label}: ${label}`;
};

const toDateStr = (ts: number) => {
  const d = new Date(ts);

  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

export const formatActivePoints = (points: ActivePoint[] | null) =>
  points
    ? points
        .map(point => {
          const label = point.datum.label
            ? `${point.datum.y} (${point.datum.label})`
            : `${point.datum.y}`;
          const raw = `x=${toDateStr(point.datum.x)}, y=${point.datum.y}`;

          return `${point.series.label}: ${label} [${raw}]`;
        })
        .join(" · ")
    : "Drag over the chart";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Таймфреймы годовых данных: ширина окна от правого края. */
export const TIMEFRAME_PRESETS: ChartRangePreset[] = [
  { key: "day", label: "День", span: DAY },
  { key: "week", label: "Неделя", span: 7 * DAY },
  { key: "month", label: "Месяц", span: 30 * DAY },
  { key: "year", label: "Год", span: 365 * DAY },
  { key: "all", label: "Всё", span: "all" },
];

/** Таймфреймы минутных данных. */
export const MINUTE_PRESETS: ChartRangePreset[] = [
  { key: "hour", label: "Час", span: HOUR },
  { key: "day", label: "Сутки", span: DAY },
  { key: "week", label: "Неделя", span: 7 * DAY },
  { key: "all", label: "Всё", span: "all" },
];

/** Таймфреймы live-тикера (x — секунды). */
export const LIVE_PRESETS: ChartRangePreset[] = [
  { key: "30s", label: "30 с", span: 30 },
  { key: "2m", label: "2 мин", span: 120 },
  { key: "all", label: "Всё", span: "all" },
];

const pad2 = (value: number) => String(value).padStart(2, "0");

/** Дата и время для подписи окна: «5.10.2025 14:00». */
export const formatDateTime = (value: number) => {
  const date = new Date(value);

  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
};
