import { AgentAlertsCard } from "@entities/agent";
import type { NodeDto } from "@shared/api/gen/main/model";
import { Col, Notice, Skeleton } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import type { NodeDetailVM } from "../model/useNodeDetailVM";
import { NodeAgentEmpty } from "./NodeAgentEmpty";
import { NodeAgentSummary } from "./NodeAgentSummary";
import { NodeInfoCard } from "./NodeInfoCard";
import { ProvisionJobBanner } from "./ProvisionJobBanner";

interface INodeOverviewContentProps {
  vm: NodeDetailVM;
  node: NodeDto;
}

/**
 * Начало вкладки «Обзор» узла: ход установки, что не так, сведения узла и
 * агент кратко; без агента — как его установить (данных прежнего агента нет).
 */
export const NodeOverviewContent: FC<INodeOverviewContentProps> = observer(
  ({ vm, node }) => (
    <Col gap={12}>
      <ProvisionJobBanner
        job={node.job}
        run={vm.job}
        nodeStatus={node.status}
        agentOnline={!!node.agent?.online}
      />
      {!!node.statusMessage && node.status === "error" && (
        <Notice
          variant={"danger"}
          title={"Узел не в порядке"}
          description={node.statusMessage}
        />
      )}
      {vm.addressMismatch && (
        <Notice
          variant={"warning"}
          title={"Агент подключается с другого адреса"}
          description={`Адрес узла — ${node.host}, а агент выходит на связь с ${node.agent?.address}. Проверьте адрес узла: по нему идут вход по SSH и проверка связи.`}
        />
      )}
      {!!node.agent?.revoked && (
        <Notice
          variant={"danger"}
          title={"Агент отозван"}
          description={
            "Его ключ больше не принимается. Установите агента заново."
          }
        />
      )}
      {!node.agentId ? (
        <NodeAgentEmpty
          node={node}
          canProvision={vm.access.canProvision}
          onCommand={() => vm.provision.openFor(node, "install", "command")}
          onSsh={() => vm.provision.openFor(node, "install", "ssh")}
        />
      ) : vm.agent ? (
        <NodeAgentSummary vm={vm} agent={vm.agent} />
      ) : vm.isAgentLoading ? (
        <Skeleton height={160} borderRadius={16} />
      ) : (
        <Notice
          variant={"warning"}
          title={"Агент узла недоступен"}
          description={"Сведения об агенте не загрузились"}
        />
      )}
      <AgentAlertsCard alerts={vm.alerts} />
      <NodeInfoCard node={node} />
    </Col>
  ),
);
