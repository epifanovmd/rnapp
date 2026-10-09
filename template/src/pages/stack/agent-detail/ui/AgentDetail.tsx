import { agentSubtitle } from "@entities/agent";
import {
  agentActionItems,
  type TAgentMenuAction,
} from "@features/manage-agent";
import type { ScreenProps } from "@shared/lib/navigation";
import {
  ActionSheet,
  BottomSheet,
  Col,
  IconButton,
  Navbar,
  Row,
  ScreenFallback,
  Text,
} from "@shared/ui";
import { AgentTabsNavigator } from "@widgets/agent-tabs";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useRef } from "react";

import { useAgentDetailVM } from "../model/useAgentDetailVM";
import { AgentOverviewContent } from "./AgentOverviewContent";

export type TAgentDetailProps = ScreenProps<{ agentId: string }>;

/**
 * Экран агента: скрывающаяся шапка с меню действий (обновление, ключ, отзыв,
 * удаление) и вкладки — обзор, воркеры, настройки, запрос, события, журнал.
 */
export const AgentDetail: FC<TAgentDetailProps> = observer(({ route }) => {
  const vm = useAgentDetailVM(route.params.agentId);
  const sheetRef = useRef<BottomSheet>(null);
  const { agent } = vm;
  const items = agentActionItems(vm.menu);

  const openActions = useCallback(() => sheetRef.current?.present(), []);

  const onSelect = (key: TAgentMenuAction) => {
    if (!agent) return;

    if (key === "update") vm.actions.update(agent, vm.menu.updateTo);
    else if (key === "rotate") vm.actions.rotateKey(agent);
    else if (key === "revoke") vm.actions.revoke(agent);
    else vm.actions.remove(agent);
  };

  if (!vm.canView) {
    return (
      <Col flex={1} bg={"background"}>
        <ScreenFallback
          title={"Агент"}
          notFound={{
            icon: "lock",
            title: "Нет доступа",
            description: "Нужно право на просмотр агентов",
          }}
        />
      </Col>
    );
  }

  return (
    <Col flex={1} bg={"background"}>
      {agent ? (
        <AgentTabsNavigator
          agent={agent}
          access={vm.access}
          header={
            <Navbar>
              <Navbar.BackButton />
              <Navbar.Content>
                <Col alignItems={"center"} flexShrink={1}>
                  <Text textStyle={"Title_S1"} numberOfLines={1}>
                    {agent.name}
                  </Text>
                  <Text
                    textStyle={"Caption_M3"}
                    color={"textSecondary"}
                    numberOfLines={1}
                  >
                    {agentSubtitle(agent)}
                  </Text>
                </Col>
              </Navbar.Content>
              <Navbar.Right>
                <Row alignItems={"center"} ph={12}>
                  {items.length > 0 && (
                    <IconButton
                      name={"moreVertical"}
                      accessibilityLabel={"Действия с агентом"}
                      onPress={openActions}
                    />
                  )}
                </Row>
              </Navbar.Right>
            </Navbar>
          }
          overview={<AgentOverviewContent vm={vm} agent={agent} />}
          onRefresh={vm.reload}
        />
      ) : vm.isError ? (
        <ScreenFallback
          title={"Агент"}
          notFound={{ title: "Агент не найден" }}
        />
      ) : (
        <ScreenFallback title={"Агент"} isLoading />
      )}
      <ActionSheet<TAgentMenuAction>
        ref={sheetRef}
        title={agent?.name}
        items={items}
        onSelect={onSelect}
      />
    </Col>
  );
});
