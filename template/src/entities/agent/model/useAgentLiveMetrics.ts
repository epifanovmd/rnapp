import { IMainApi } from "@shared/api";
import type { IAgentMetricsPointDto } from "@shared/api/gen/main/model";
import { useEntity, type UseEntityResult } from "@shared/lib/holders";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";

import {
  LIVE_METRICS_WINDOW_MS,
  mergeMetricsPoints,
  METRICS_POINTS_LIMIT,
} from "../lib/metrics";
import type { IAgentMetricsEvent } from "./types";

/** Окно точек вместе с агентом, которому оно принадлежит. */
interface IAgentLiveWindow {
  agentId: string;
  points: IAgentMetricsPointDto[];
}

const NO_POINTS: IAgentMetricsPointDto[] = [];

/** Точки окна, только если оно того же агента: при смене агента прежние не показываются. */
const pointsOf = (
  live: IAgentLiveWindow | null | undefined,
  agentId: string,
): IAgentMetricsPointDto[] =>
  live?.agentId === agentId ? live.points : NO_POINTS;

/**
 * Живые метрики агента: последние минуты с сервера при открытии, дальше —
 * точки `agent:metrics` из комнаты агента (пока она открыта, агент шлёт их
 * часто); после переподключения окно перечитывается. `agentId: null` — не
 * загружать и не слушать.
 */
export const useAgentLiveMetrics = (agentId: string | null) => {
  const api = IMainApi.useInstance();
  const live: UseEntityResult<IAgentLiveWindow, string> = useEntity({
    queryFn: async (id: string) => {
      const since = Date.now() - LIVE_METRICS_WINDOW_MS;
      const res = await api.getAgentMetrics(
        id,
        { since, limit: METRICS_POINTS_LIMIT },
        { queryRace: false },
      );

      if (!res.data) return { error: res.error };

      // Точки, пришедшие событиями во время запроса, не теряются.
      return {
        data: {
          agentId: id,
          points: mergeMetricsPoints(res.data, pointsOf(live.data, id), since),
        },
      };
    },
    watch: [agentId ?? ""],
    enabled: agentId !== null,
  });

  useSocketRoom("agent", agentId, () => {
    if (agentId) live.refresh(agentId);
  });
  useSocketEvent<[IAgentMetricsEvent]>(
    "agent:metrics",
    event => {
      if (event.agentId !== agentId) return;

      live.setData({
        agentId,
        points: mergeMetricsPoints(
          pointsOf(live.data, agentId),
          [event.point],
          Date.now() - LIVE_METRICS_WINDOW_MS,
        ),
      });
    },
    agentId !== null,
  );

  const points = agentId ? pointsOf(live.data, agentId) : NO_POINTS;

  return {
    points,
    /** Последняя точка: свежее, чем в карточке агента. */
    latest: points.at(-1),
    isLoading: live.isLoading,
  };
};
