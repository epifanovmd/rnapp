import { AgentStatusTag, formatMoment, workersSummary } from "@entities/agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { Button, Col, InfoRow, Row, Section, Tag } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { NodeDetailVM } from "../model/useNodeDetailVM";

interface INodeAgentSummaryProps {
  vm: NodeDetailVM;
  agent: AgentDto;
}

/** Агент узла кратко: связь, версия и обновление, воркеры. */
export const NodeAgentSummary: FC<INodeAgentSummaryProps> = observer(
  ({ vm, agent }) => {
    const workers = workersSummary(agent);
    const canUpdate = vm.access.canManage && vm.agentLive && vm.updateAvailable;

    return (
      <Section
        title={"Агент"}
        description={"Связь с сервером, версия и воркеры"}
      >
        <Row wrap gap={6} alignItems={"center"}>
          <AgentStatusTag agent={agent} />
          {vm.updateAvailable && (
            <Tag variant={"warning"} icon={"upgrade"}>
              {vm.updateTarget
                ? `доступна ${vm.updateTarget}`
                : "есть новая версия"}
            </Tag>
          )}
        </Row>
        <Col gap={4}>
          <InfoRow label={"Версия"} value={agent.version} mono />
          <InfoRow
            label={"Воркеры"}
            value={
              workers.total
                ? `${workers.total}${workers.troubled ? `, проблем ${workers.troubled}` : ""}`
                : "нет"
            }
          />
          <InfoRow
            label={agent.online ? "На связи с" : "Последняя связь"}
            value={formatMoment(
              agent.online ? agent.connectedAt : agent.lastSeenAt,
            )}
          />
        </Col>
        {canUpdate && (
          <Button
            title={
              vm.updateTarget
                ? `Обновить до ${vm.updateTarget}`
                : "Обновить агента"
            }
            variant={"secondary"}
            appearance={"outline"}
            size={"small"}
            leftIcon={"upgrade"}
            loading={vm.agentActions.isBusy("update", agent.id)}
            onPress={() => vm.agentActions.update(agent, vm.updateTarget)}
          />
        )}
      </Section>
    );
  },
);
