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

/**
 * Живые метрики агента: последние минуты с сервера при открытии, дальше —
 * точки `agent:metrics` из комнаты агента (пока она открыта, агент шлёт их
 * часто); после переподключения окно перечитывается. `agentId: null` — не
 * загружать и не слушать.
 */
export const useAgentLiveMetrics = (agentId: string | null) => {
  const api = IMainApi.useInstance();
  const live: UseEntityResult<IAgentMetricsPointDto[], string> = useEntity({
    queryFn: async (id: string) => {
      const since = Date.now() - LIVE_METRICS_WINDOW_MS;
      const res = await api.getAgentMetrics(
        id,
        { since, limit: METRICS_POINTS_LIMIT },
        { queryRace: false },
      );

      // Точки, пришедшие событиями во время запроса, не теряются.
      return res.data
        ? { data: mergeMetricsPoints(res.data, live.data ?? [], since) }
        : res;
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

      live.setData(
        mergeMetricsPoints(
          live.data ?? [],
          [event.point],
          Date.now() - LIVE_METRICS_WINDOW_MS,
        ),
      );
    },
    agentId !== null,
  );

  const points = live.data ?? [];

  return {
    points,
    /** Последняя точка: свежее, чем в карточке агента. */
    latest: points.at(-1),
    isLoading: live.isLoading,
  };
};
