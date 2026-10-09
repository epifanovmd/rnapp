import { WorkerConfigModal } from "@features/edit-worker-config";
import type { AgentDto } from "@shared/api/gen/main/model";
import { Col, EmptyState, Notice, Skeleton } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useAgentConfigsVM } from "../model/useAgentConfigsVM";
import { WorkerConfigsCard } from "./WorkerConfigsCard";

interface IAgentConfigsListProps {
  agent: AgentDto;
  /** Значения настроек: просмотр, запись и удаление. */
  canConfig: boolean;
}

/** Настройки воркеров: по воркеру — ключи из манифеста, версии и итог применения. */
export const AgentConfigsList: FC<IAgentConfigsListProps> = observer(
  ({ agent, canConfig }) => {
    const vm = useAgentConfigsVM(agent, canConfig);

    if (vm.isLoading && vm.groups.every(group => group.items.length === 0)) {
      return <Skeleton height={128} borderRadius={16} />;
    }

    return (
      <Col gap={12}>
        {!!vm.error && (
          <Notice
            variant={"danger"}
            title={"Настройки не загрузились"}
            description={vm.error.message}
          />
        )}
        {!agent.online && vm.groups.length > 0 && (
          <Notice
            variant={"info"}
            description={
              "Агент без связи: новые версии настроек он получит при подключении."
            }
          />
        )}
        {!canConfig && vm.groups.length > 0 && (
          <Notice
            variant={"info"}
            description={
              "Значения настроек видны и меняются только с правом на настройки воркеров."
            }
          />
        )}
        {vm.groups.length === 0 ? (
          <EmptyState
            icon={"sliders"}
            title={"Воркеров нет"}
            description={"Настройки бывают у воркеров из настроек агента"}
          />
        ) : (
          vm.groups.map(group => (
            <WorkerConfigsCard key={group.worker} group={group} vm={vm} />
          ))
        )}
        {canConfig && <WorkerConfigModal vm={vm.editor} />}
      </Col>
    );
  },
);
