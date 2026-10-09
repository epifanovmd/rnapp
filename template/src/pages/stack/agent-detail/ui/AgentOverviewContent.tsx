import { AgentAlertsCard, AgentStatusTag } from "@entities/agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { useNavigation } from "@shared/lib/navigation";
import { Button, Col, Notice, Row, Section, Tag } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { AgentDetailVM } from "../model/useAgentDetailVM";

interface IAgentOverviewContentProps {
  vm: AgentDetailVM;
  agent: AgentDto;
}

/** Начало вкладки «Обзор» агента: связь, обновление, узел и проблемы. */
export const AgentOverviewContent: FC<IAgentOverviewContentProps> = observer(
  ({ vm, agent }) => {
    const navigation = useNavigation();
    const { node } = vm;

    return (
      <Col gap={12}>
        {agent.revoked && (
          <Notice
            variant={"danger"}
            title={"Агент отозван"}
            description={
              "Его ключ больше не принимается. Вернуть агента можно только новой регистрацией."
            }
          />
        )}
        <Section title={"Состояние"}>
          <Row wrap gap={6} alignItems={"center"}>
            <AgentStatusTag agent={agent} />
            {!!vm.candidate && (
              <Tag variant={"warning"} icon={"upgrade"}>
                {`доступна ${vm.candidate}`}
              </Tag>
            )}
          </Row>
          {!!vm.menu.updateTo && (
            <Button
              title={`Обновить до ${vm.menu.updateTo}`}
              variant={"secondary"}
              appearance={"outline"}
              size={"small"}
              leftIcon={"upgrade"}
              loading={vm.actions.isBusy("update", agent.id)}
              onPress={() => vm.actions.update(agent, vm.menu.updateTo)}
            />
          )}
          {!!node && (
            <Button
              title={`Узел ${node.name}`}
              appearance={"ghost"}
              size={"small"}
              leftIcon={"server"}
              alignSelf={"flex-start"}
              onPress={() =>
                navigation.navigate("NodeDetail", { nodeId: node.id })
              }
            />
          )}
        </Section>
        <AgentAlertsCard alerts={vm.alerts} />
      </Col>
    );
  },
);
