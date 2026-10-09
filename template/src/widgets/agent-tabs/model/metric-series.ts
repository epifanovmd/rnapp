import { type IAgentHostMetrics, pointHost } from "@entities/agent";
import type { IAgentMetricsPointDto } from "@shared/api/gen/main/model";

/** Точка графика: время и значение. */
export interface IMetricDatum {
  x: number;
  y: number;
}

/** Значение показателя узла из метрик точки; нет — `undefined`. */
export type TMetricPick = (host: IAgentHostMetrics) => number | undefined;

/** Ряд показателя по точкам метрик: точки без значения пропускаются. */
export const metricSeriesData = (
  points: IAgentMetricsPointDto[],
  pick: TMetricPick,
): IMetricDatum[] =>
  points.flatMap(point => {
    const host = pointHost(point);
    const value = host ? pick(host) : undefined;

    return value === undefined ? [] : [{ x: point.at, y: value }];
  });

/** Доля памяти, %. */
export const memoryPercent: TMetricPick = host =>
  host.memUsedBytes !== undefined && host.memTotalBytes
    ? (host.memUsedBytes / host.memTotalBytes) * 100
    : undefined;
