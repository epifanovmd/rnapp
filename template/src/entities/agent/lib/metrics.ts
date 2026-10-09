import type { IAgentMetricsPointDto } from "@shared/api/gen/main/model";

/** Сколько держит живой график, мс. */
export const LIVE_METRICS_WINDOW_MS = 5 * 60_000;

/** Больше точек сервер за раз не отдаёт. */
export const METRICS_POINTS_LIMIT = 5000;

/** Период истории метрик. */
export interface IMetricsPeriod {
  value: "1h" | "6h" | "24h";
  label: string;
  windowMinutes: number;
}

export const METRICS_PERIODS: IMetricsPeriod[] = [
  { value: "1h", label: "1 ч", windowMinutes: 60 },
  { value: "6h", label: "6 ч", windowMinutes: 360 },
  { value: "24h", label: "24 ч", windowMinutes: 1440 },
];

/**
 * Точки по возрастанию времени без повторов (история и поток пересекаются),
 * не старше `since`. Досланные без связи встают на своё место.
 */
export const mergeMetricsPoints = (
  prev: IAgentMetricsPointDto[],
  add: IAgentMetricsPointDto[],
  since: number,
): IAgentMetricsPointDto[] => {
  const seen = new Set(prev.map(point => point.at));
  const fresh = add.filter(point => {
    if (seen.has(point.at)) return false;
    seen.add(point.at);

    return true;
  });

  return [...prev, ...fresh]
    .filter(point => point.at >= since)
    .sort((a, b) => a.at - b.at);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const numberOr = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const stringOr = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const recordsOf = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

export interface IAgentDisk {
  mount: string;
  usedBytes?: number;
  totalBytes?: number;
}

export interface IAgentInterface {
  name: string;
  rxBps?: number;
  txBps?: number;
}

/**
 * Метрики узла от встроенного воркера метрик. Все поля необязательные: нет
 * группы на платформе — нет поля.
 */
export interface IAgentHostMetrics {
  cpuPercent?: number;
  cpuCores: number[];
  load1?: number;
  load5?: number;
  load15?: number;
  memUsedBytes?: number;
  memTotalBytes?: number;
  swapUsedBytes?: number;
  swapTotalBytes?: number;
  diskUsedBytes?: number;
  diskTotalBytes?: number;
  disks: IAgentDisk[];
  diskReadBps?: number;
  diskWriteBps?: number;
  netRxBps?: number;
  netTxBps?: number;
  netErrors?: number;
  interfaces: IAgentInterface[];
  conntrack?: number;
  conntrackMax?: number;
  processes?: number;
  threads?: number;
  fdsOpen?: number;
  fdsMax?: number;
  uptimeSec?: number;
  temperatureMaxC?: number;
}

const NUMBER_FIELDS = [
  "cpuPercent",
  "load1",
  "load5",
  "load15",
  "memUsedBytes",
  "memTotalBytes",
  "swapUsedBytes",
  "swapTotalBytes",
  "diskUsedBytes",
  "diskTotalBytes",
  "diskReadBps",
  "diskWriteBps",
  "netRxBps",
  "netTxBps",
  "netErrors",
  "conntrack",
  "conntrackMax",
  "processes",
  "threads",
  "fdsOpen",
  "fdsMax",
  "uptimeSec",
] as const;

/**
 * Метрики узла из точки: сервер передаёт ответ агента как есть, поэтому
 * значения не того вида пропускаются, а не ломают экран.
 */
export const hostMetrics = (host: unknown): IAgentHostMetrics | undefined => {
  if (!isRecord(host)) return undefined;

  const numbers: Partial<Record<(typeof NUMBER_FIELDS)[number], number>> = {};

  for (const field of NUMBER_FIELDS) {
    const value = numberOr(host[field]);

    if (value !== undefined) numbers[field] = value;
  }

  const temperatures = isRecord(host.temperatures)
    ? host.temperatures
    : undefined;

  return {
    ...numbers,
    cpuCores: Array.isArray(host.cpuCores)
      ? host.cpuCores.flatMap(core => numberOr(core) ?? [])
      : [],
    disks: recordsOf(host.disks).flatMap(disk => {
      const mount = stringOr(disk.mount);

      return mount
        ? [
            {
              mount,
              usedBytes: numberOr(disk.usedBytes),
              totalBytes: numberOr(disk.totalBytes),
            },
          ]
        : [];
    }),
    interfaces: recordsOf(host.interfaces).flatMap(item => {
      const name = stringOr(item.name);

      return name
        ? [{ name, rxBps: numberOr(item.rxBps), txBps: numberOr(item.txBps) }]
        : [];
    }),
    temperatureMaxC: numberOr(temperatures?.maxC),
  };
};

/** Метрики узла из точки; точки нет — `undefined`. */
export const pointHost = (
  point: IAgentMetricsPointDto | undefined | null,
): IAgentHostMetrics | undefined => hostMetrics(point?.host);

/** Самая свежая из двух точек: живой и последней из карточки агента. */
export const fresherPoint = (
  live: IAgentMetricsPointDto | undefined,
  known: IAgentMetricsPointDto | undefined,
): IAgentMetricsPointDto | undefined =>
  live && live.at >= (known?.at ?? 0) ? live : known;

/** Ответ `GET /metrics` воркера в точке; нет — `undefined`. */
export const workerMetrics = (
  point: IAgentMetricsPointDto | undefined,
  worker: string,
): unknown => point?.workers?.[worker];
