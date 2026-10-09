import { AssignNodeOwnerModal } from "@features/assign-node-owner";
import { NodeFormModal } from "@features/manage-node";
import { ProvisionNodeAgentModal } from "@features/provision-node-agent";
import { type ScreenProps, useNavigation } from "@shared/lib/navigation";
import { ActionSheet, BottomSheet, Col, ScreenFallback } from "@shared/ui";
import { AgentTabsNavigator } from "@widgets/agent-tabs";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useRef } from "react";

import { nodeActionItems, type TNodeAction } from "../model/node-actions";
import { useNodeDetailVM } from "../model/useNodeDetailVM";
import { NodeHeader } from "./NodeHeader";
import { NodeOverviewContent } from "./NodeOverviewContent";

export type TNodeDetailProps = ScreenProps<{ nodeId: string }>;

/**
 * Экран узла: скрывающаяся шапка с меню действий и вкладки — обзор узла и
 * агента, воркеры, настройки, запрос, события, журнал. Без агента — только
 * обзор с установкой.
 */
export const NodeDetail: FC<TNodeDetailProps> = observer(({ route }) => {
  const { nodeId } = route.params;
  const vm = useNodeDetailVM(nodeId);
  const navigation = useNavigation();
  const sheetRef = useRef<BottomSheet>(null);
  const { node, agent } = vm;

  const items = node
    ? nodeActionItems(node, vm.access, {
        agentLive: vm.agentLive,
        updateAvailable: vm.updateAvailable,
        canViewAgents: vm.canViewAgents,
      })
    : [];

  const openActions = useCallback(() => sheetRef.current?.present(), []);

  const onSelect = (key: TNodeAction) => {
    if (!node) return;

    if (key === "installCommand")
      vm.provision.openFor(node, "install", "command");
    else if (key === "installSsh") vm.provision.openFor(node, "install", "ssh");
    else if (key === "uninstall") vm.provision.openFor(node, "uninstall");
    else if (key === "updateAgent" && agent) {
      vm.agentActions.update(agent, vm.updateTarget);
    } else if (key === "rotateKey" && agent) vm.agentActions.rotateKey(agent);
    else if (key === "agentPage" && node.agentId) {
      navigation.navigate("AgentDetail", { agentId: node.agentId });
    } else if (key === "edit") vm.form.openEdit(node);
    else if (key === "owner") vm.owner.openFor(node);
    else if (key === "delete") vm.removeNode(node);
  };

  if (!vm.canView) {
    return (
      <Col flex={1} bg={"background"}>
        <ScreenFallback
          title={"Узел"}
          notFound={{
            icon: "lock",
            title: "Нет доступа",
            description: "Нужно право на просмотр узлов",
          }}
        />
      </Col>
    );
  }

  return (
    <Col flex={1} bg={"background"}>
      {node ? (
        <AgentTabsNavigator
          agent={agent}
          access={vm.tabsAccess}
          header={
            <NodeHeader
              node={node}
              onActions={items.length ? openActions : undefined}
            />
          }
          overview={<NodeOverviewContent vm={vm} node={node} />}
          onRefresh={vm.reload}
        />
      ) : vm.isError ? (
        <ScreenFallback title={"Узел"} notFound={{ title: "Узел не найден" }} />
      ) : (
        <ScreenFallback title={"Узел"} isLoading />
      )}
      <ActionSheet<TNodeAction>
        ref={sheetRef}
        title={node?.name}
        items={items}
        onSelect={onSelect}
      />
      <NodeFormModal vm={vm.form} />
      <AssignNodeOwnerModal vm={vm.owner} />
      <ProvisionNodeAgentModal vm={vm.provision} />
    </Col>
  );
});
