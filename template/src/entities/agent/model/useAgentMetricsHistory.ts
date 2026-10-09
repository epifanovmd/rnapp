import { IMainApi } from "@shared/api";
import type { IAgentMetricsPointDto } from "@shared/api/gen/main/model";
import { useEntity } from "@shared/lib/holders";
import { useState } from "react";

import {
  type IMetricsPeriod,
  METRICS_PERIODS,
  METRICS_POINTS_LIMIT,
} from "../lib/metrics";

type TPeriodValue = IMetricsPeriod["value"];

/** История метрик агента за выбранный период (1 ч, 6 ч, 24 ч). */
export const useAgentMetricsHistory = (agentId: string | null) => {
  const api = IMainApi.useInstance();
  const [period, setPeriod] = useState<TPeriodValue>("1h");
  const current =
    METRICS_PERIODS.find(item => item.value === period) ?? METRICS_PERIODS[0];
  // Ключ запроса — строка: перезапрос при смене агента или периода.
  const key = `${agentId ?? ""}/${current.value}`;
  const history = useEntity<IAgentMetricsPointDto[], string>({
    queryFn: () =>
      api.getAgentMetrics(
        agentId ?? "",
        {
          since: Date.now() - current.windowMinutes * 60_000,
          limit: METRICS_POINTS_LIMIT,
        },
        { queryRace: false },
      ),
    watch: [key],
    enabled: agentId !== null,
  });

  return {
    period,
    setPeriod,
    periods: METRICS_PERIODS,
    points: history.data ?? [],
    isLoading: history.isLoading,
    reload: () => (agentId ? history.refresh(key) : Promise.resolve()),
  };
};
