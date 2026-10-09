import {
  agentLabels,
  agentPlatform,
  formatAgo,
  formatMoment,
  formatUptime,
  type IAgentHostMetrics,
} from "@entities/agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { Col, InfoRow, Section } from "@shared/ui";
import React, { FC } from "react";

interface IAgentInfoCardProps {
  agent: AgentDto;
  host: IAgentHostMetrics | undefined;
}

/** Сведения об агенте и узле: версия, ОС, ядро, время работы, связь, метки. */
export const AgentInfoCard: FC<IAgentInfoCardProps> = ({ agent, host }) => {
  const labels = agentLabels(agent.labels);

  return (
    <Section title={"Агент и узел"}>
      <Col gap={4}>
        <InfoRow label={"Версия агента"} value={agent.version} mono />
        <InfoRow label={"Узел"} value={agent.host?.hostname} />
        <InfoRow label={"ОС"} value={agentPlatform(agent) ?? undefined} />
        <InfoRow label={"Ядро"} value={agent.host?.kernel} />
        <InfoRow label={"Адрес подключения"} value={agent.address} mono />
        <InfoRow
          label={"Узел работает"}
          value={formatUptime(host?.uptimeSec)}
        />
        <InfoRow
          label={"Агент запущен"}
          value={agent.startedAt ? formatAgo(agent.startedAt) : undefined}
        />
        <InfoRow
          label={agent.online ? "На связи с" : "Последняя связь"}
          value={formatMoment(
            agent.online ? agent.connectedAt : agent.lastSeenAt,
          )}
        />
        <InfoRow
          label={"Зарегистрирован"}
          value={formatMoment(agent.enrolledAt)}
        />
        <InfoRow
          label={"Метки"}
          value={labels.length ? labels.join(", ") : "нет"}
        />
      </Col>
    </Section>
  );
};
