import { formatPercent } from "@entities/agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { useTheme } from "@shared/lib/theme";
import { Col, Section, Segmented, type SegmentedOption } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useMemo } from "react";

import { memoryPercent } from "../model/metric-series";
import { useAgentOverviewVM } from "../model/useAgentOverviewVM";
import { AgentInfoCard } from "./AgentInfoCard";
import {
  AgentMetricsChart,
  type IAgentMetricSeries,
} from "./AgentMetricsChart";
import { AgentStatCards } from "./AgentStatCards";

interface IAgentOverviewProps {
  agent: AgentDto;
}

type TPeriod = "1h" | "6h" | "24h";

/** Обзор агента: показатели узла, живой график, история и сведения. */
export const AgentOverview: FC<IAgentOverviewProps> = observer(({ agent }) => {
  const { colors } = useTheme();
  const vm = useAgentOverviewVM(agent);
  const series = useMemo<IAgentMetricSeries[]>(
    () => [
      {
        id: "cpu",
        label: "Процессор",
        color: colors.primary,
        pick: host => host.cpuPercent,
      },
      {
        id: "memory",
        label: "Память",
        color: colors.warning,
        pick: memoryPercent,
      },
    ],
    [colors],
  );
  const periods: SegmentedOption<TPeriod>[] = vm.history.periods.map(
    period => ({ value: period.value, label: period.label }),
  );

  return (
    <Col gap={12}>
      <AgentStatCards host={vm.host} outbox={agent.outbox} />
      <Section
        title={"Сейчас"}
        description={"Последние минуты, обновляется само"}
      >
        <AgentMetricsChart
          points={vm.live.points}
          series={series}
          formatValue={formatPercent}
          loading={vm.live.isLoading}
        />
      </Section>
      <Section title={"История"}>
        <Segmented
          options={periods}
          value={vm.history.period}
          onValueChange={vm.history.setPeriod}
        />
        <AgentMetricsChart
          points={vm.history.points}
          series={series}
          formatValue={formatPercent}
          loading={vm.history.isLoading}
        />
      </Section>
      <AgentInfoCard agent={agent} host={vm.host} />
    </Col>
  );
});
