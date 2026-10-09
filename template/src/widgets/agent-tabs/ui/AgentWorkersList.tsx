import type { AgentDto } from "@shared/api/gen/main/model";
import { Col, Divider, Notice, Section, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, Fragment } from "react";

import { useAgentWorkersVM } from "../model/useAgentWorkersVM";
import { WorkerRow } from "./WorkerRow";

interface IAgentWorkersListProps {
  agent: AgentDto;
  /** Можно перезапускать и обновлять воркеры. */
  canManage: boolean;
}

/** Воркеры агента: состояние, самочувствие, версия, действия и подробности. */
export const AgentWorkersList: FC<IAgentWorkersListProps> = observer(
  ({ agent, canManage }) => {
    const vm = useAgentWorkersVM(agent, canManage);

    return (
      <Section
        title={"Воркеры"}
        description={"Сервисы на узле, которые запускает агент"}
      >
        {!agent.online && vm.rows.length > 0 && (
          <Notice
            variant={"warning"}
            title={"Агент без связи"}
            description={
              "Состав воркеров — на момент последней связи; что с ними сейчас, неизвестно."
            }
          />
        )}
        {vm.rows.length === 0 ? (
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {agent.online
              ? "Воркеров нет — их задают при установке агента"
              : "Агент без связи: состав воркеров неизвестен"}
          </Text>
        ) : (
          <Col>
            {vm.rows.map((row, index) => (
              <Fragment key={row.worker.name}>
                {index > 0 && <Divider />}
                <WorkerRow row={row} vm={vm} />
              </Fragment>
            ))}
          </Col>
        )}
      </Section>
    );
  },
);
