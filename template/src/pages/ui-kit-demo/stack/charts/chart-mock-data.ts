import type { ChartDatum, IChartSeries } from "@shared/ui/chart";

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const RESOLUTION = 10;

export const REVENUE_VS_EXPENSES: IChartSeries[] = [
  {
    id: "revenue",
    label: "Revenue",
    color: "#10B981",
    data: range(12 * RESOLUTION).map((i): ChartDatum => {
      const month = i / RESOLUTION;

      return {
        x: i,
        y: Math.round(320 + month * 16 + Math.sin(month / 1.5) * 35),
        label: MONTHS[Math.floor(month) % 12],
      };
    }),
  },
  {
    id: "expenses",
    label: "Expenses",
    color: "#EF4444",
    data: range(12 * RESOLUTION).map((i): ChartDatum => {
      const month = i / RESOLUTION;

      return {
        x: i,
        y: Math.round(230 + month * 9 + Math.cos(month / 1.7) * 25),
        label: MONTHS[Math.floor(month) % 12],
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
