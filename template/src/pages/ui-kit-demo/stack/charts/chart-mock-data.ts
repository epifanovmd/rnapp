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

export const DAILY_ACTIVE_USERS: IChartSeries[] = [
  {
    id: "dau",
    label: "Active users",
    data: range(14 * RESOLUTION).map((i): ChartDatum => {
      const day = i / RESOLUTION;

      return {
        x: i,
        y: Math.round(130 + Math.sin(day / 2.2) * 35 + day * 5),
        label: `Day ${Math.floor(day) + 1}`,
      };
    }),
  },
];

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

export const WEEKLY_SALES: IChartSeries[] = [
  {
    id: "online",
    label: "Online",
    color: "#3B82F6",
    data: range(6 * RESOLUTION).map((i): ChartDatum => {
      const week = i / RESOLUTION;

      return {
        x: i,
        y: Math.round(55 + Math.sin(week) * 20 + week * 4),
        label: `W${Math.floor(week) + 1}`,
      };
    }),
  },
  {
    id: "retail",
    label: "Retail",
    color: "#F59E0B",
    data: range(6 * RESOLUTION).map((i): ChartDatum => {
      const week = i / RESOLUTION;

      return {
        x: i,
        y: Math.round(40 + Math.cos(week / 1.3) * 18 + week * 2),
        label: `W${Math.floor(week) + 1}`,
      };
    }),
  },
];

export const ORDER_VALUES: IChartSeries[] = [
  {
    id: "orders",
    label: "Order value, $",
    color: "#06B6D4",
    data: range(20).map((i): ChartDatum => ({
      x: i,
      y: Math.round(40 + Math.sin(i * 1.3) * 25 + (i % 3) * 10),
      label: `#${i + 1}`,
    })),
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

  return [...data.slice(1), next];
};

export const TEMPERATURE_TREND: IChartSeries[] = [
  {
    id: "temperature",
    label: "Temp, °C",
    color: "#8B5CF6",
    data: range(24 * RESOLUTION).map((i): ChartDatum => {
      const hour = i / RESOLUTION;

      return {
        x: i,
        y: Math.round((18 + Math.sin((hour - 6) / 3.8) * 7) * 10) / 10,
        label: `${Math.floor(hour)}:00`,
      };
    }),
  },
];
