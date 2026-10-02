import type { ActivePoint, IChartSeries } from "@shared/ui/chart";

import { REVENUE_VS_EXPENSES } from "./chart-mock-data";

export const peakRevenue = REVENUE_VS_EXPENSES[0].data.reduce((best, datum) =>
  datum.y > best.y ? datum : best,
);

// Модуль-скоуп: не зависят от пропсов/состояния компонента, поэтому не нужно
// пересоздавать их на каждый рендер через useCallback — уже стабильны сами по себе.
const MONTHS_SHORT = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export const formatAxisLabel = (value: number, period: Period) => {
  const d = new Date(value);

  switch (period) {
    case "day":
      return `${String(d.getHours()).padStart(2, "0")}:00`;
    case "week":
      return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}`;
    case "month":
      return `${d.getDate()}.${d.getMonth() + 1}`;
    case "year":
      return MONTHS_SHORT[d.getMonth()];
  }
};

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

export type Period = "day" | "week" | "month" | "year";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
];

const LAST_DATE = new Date(2025, 11, 31).getTime();

/** Точек на серию не больше: год по 3 часа — 2920 точек, пути на них дороги. */
const MAX_POINTS = 365;

const thin = <T>(data: T[]): T[] => {
  if (data.length <= MAX_POINTS) return data;

  const step = Math.ceil(data.length / MAX_POINTS);

  return data.filter(
    (_, index) => index % step === 0 || index === data.length - 1,
  );
};

export const filterByPeriod = (
  series: IChartSeries[],
  period: Period,
): IChartSeries[] => {
  const limits: Record<Period, number> = {
    day: LAST_DATE - 86_400_000,
    week: LAST_DATE - 7 * 86_400_000,
    month: LAST_DATE - 30 * 86_400_000,
    year: 0,
  };
  const from = limits[period];

  return series.map(s => ({
    ...s,
    data: thin(from > 0 ? s.data.filter(d => d.x >= from) : s.data),
  }));
};
