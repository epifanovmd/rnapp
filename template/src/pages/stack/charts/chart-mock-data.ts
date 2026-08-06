import type { ChartDatum, IChartSeries } from "@shared/ui/chart";

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

const RU_MONTHS = [
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

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const POINTS_PER_DAY = 8; // каждые 3 часа
const DAYS = 365;

const START_DATE = new Date(2025, 0, 1).getTime();

const formatLabel = (ts: number) => {
  const d = new Date(ts);

  return `${d.getDate()} ${RU_MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, "0")}:00`;
};

/** Внутридневная дневная компонента: выше в середине дня, ниже утром/вечером. */
const intradayPattern = (hour: number) =>
  -Math.cos((hour / 24) * Math.PI * 2) * 12;

/** Ежедневные данные выручки и расходов за 2025 год (8 точек в день). */
export const REVENUE_VS_EXPENSES: IChartSeries[] = [
  {
    id: "revenue",
    label: "Выручка",
    color: "#10B981",
    data: range(DAYS * POINTS_PER_DAY).map((i): ChartDatum => {
      const day = Math.floor(i / POINTS_PER_DAY);
      const hour = (i % POINTS_PER_DAY) * (24 / POINTS_PER_DAY);

      return {
        x: START_DATE + day * DAY_MS + hour * HOUR_MS,
        y: Math.round(
          480 +
            (day / 30) * 18 + // годовой рост
            Math.sin(day / 30 / 1.8) * 40 + // сезонность
            Math.sin(day / 7) * 8 + // недельные циклы
            intradayPattern(hour) + // внутридневные колебания
            (Math.random() - 0.5) * 20, // шум
        ),
        label: formatLabel(START_DATE + day * DAY_MS + hour * HOUR_MS),
      };
    }),
  },
  {
    id: "expenses",
    label: "Расходы",
    color: "#EF4444",
    data: range(DAYS * POINTS_PER_DAY).map((i): ChartDatum => {
      const day = Math.floor(i / POINTS_PER_DAY);
      const hour = (i % POINTS_PER_DAY) * (24 / POINTS_PER_DAY);

      return {
        x: START_DATE + day * DAY_MS + hour * HOUR_MS,
        y: Math.round(
          320 +
            (day / 30) * 10 +
            Math.cos(day / 30 / 2.2) * 35 +
            Math.cos(day / 5) * 6 +
            intradayPattern(hour + 3) + // смещено относительно выручки
            (Math.random() - 0.5) * 12,
        ),
        label: formatLabel(START_DATE + day * DAY_MS + hour * HOUR_MS),
      };
    }),
  },
];

const LIVE_PRICE_WINDOW = 30;

export const createInitialLivePriceData = (): ChartDatum[] => {
  const points: ChartDatum[] = [];
  let price = 100;

  for (let i = 0; i < LIVE_PRICE_WINDOW; i++) {
    price = Math.max(1, price + (Math.random() - 0.5) * 2);
    points.push({
      x: i,
      y: Math.round(price * 100) / 100,
      label: `${i}s`,
    });
  }

  return points;
};

export const nextLivePriceData = (data: ChartDatum[]): ChartDatum[] => {
  const last = data[data.length - 1];
  const price = Math.max(1, last.y + (Math.random() - 0.5) * 2);
  const next: ChartDatum = {
    x: last.x + 1,
    y: Math.round(price * 100) / 100,
    label: `${last.x + 1}s`,
  };

  // Скользящее окно фиксированной длины: реальный live-тикер не должен копить
  // историю бесконечно — иначе домен/путь пересчитываются по всё большему
  // числу точек на каждый тик.
  const window = [...data, next];

  return window.length > LIVE_PRICE_WINDOW
    ? window.slice(window.length - LIVE_PRICE_WINDOW)
    : window;
};
