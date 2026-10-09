import { AgentAlertsCard } from "@entities/agent";
import { InstallAgentModal } from "@features/enroll-agent";
import {
  agentActionItems,
  type TAgentMenuAction,
} from "@features/manage-agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { useLatestRef } from "@shared/lib/hooks";
import { useNavigation } from "@shared/lib/navigation";
import {
  ActionSheet,
  BottomSheet,
  Chip,
  Col,
  Container,
  EmptyState,
  NavbarIcon,
  ScreenState,
  TextField,
  Touchable,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { FlatList, ListRenderItem, ScrollView, StyleSheet } from "react-native";

import { AGENT_FILTER_LABELS, type TAgentFilter } from "../model/agent-filter";
import { useAgentsVM } from "../model/useAgentsVM";
import { AgentCard } from "./AgentCard";

const keyExtractor = (agent: AgentDto) => agent.id;

const FILTERS = Object.keys(AGENT_FILTER_LABELS) as TAgentFilter[];

/** Проблем над списком — не больше; остальные видны в карточках агентов. */
const ALERTS_SHOWN = 5;

/** Агенты: отбор, поиск, проблемы, обновления, действия и установка нового. */
export const Agents: FC = observer(() => {
  const vm = useAgentsVM();
  const vmRef = useLatestRef(vm);
  const navigation = useNavigation();
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<AgentDto | null>(null);
  const { canEnroll } = vm;
  const openInstall = vm.install.openDialog;

  useEffect(() => {
    navigation.setOptions({
      headerRight: canEnroll
        ? () => (
            <Touchable
              onPress={openInstall}
              accessibilityRole={"button"}
              accessibilityLabel={"Установить агента"}
            >
              <NavbarIcon name={"plus"} size={22} />
            </Touchable>
          )
        : undefined,
    });
  }, [navigation, canEnroll, openInstall]);

  const openAgent = useCallback(
    (agent: AgentDto) =>
      navigation.navigate("AgentDetail", { agentId: agent.id }),
    [navigation],
  );

  const openActions = useCallback((agent: AgentDto) => {
    setSelected(agent);
    sheetRef.current?.present();
  }, []);

  const items = selected ? agentActionItems(vm.accessOf(selected)) : [];

  const onSelect = (key: TAgentMenuAction) => {
    if (!selected) return;

    if (key === "update")
      vm.actions.update(selected, vm.updateTarget(selected));
    else if (key === "rotate") vm.actions.rotateKey(selected);
    else if (key === "revoke") vm.actions.revoke(selected);
    else vm.actions.remove(selected);
  };

  const renderItem = useCallback<ListRenderItem<AgentDto>>(
    ({ item }) => {
      const current = vmRef.current;
      const hasMenu = agentActionItems(current.accessOf(item)).length > 0;

      return (
        <AgentCard
          agent={item}
          updateTarget={current.updateTarget(item)}
          alertsCount={current.alertsOf(item.id).length}
          onPress={openAgent}
          onActions={hasMenu ? openActions : undefined}
        />
      );
    },
    [openActions, openAgent, vmRef],
  );

  if (!vm.canView) {
    return (
      <Container>
        <EmptyState
          icon={"lock"}
          title={"Нет доступа"}
          description={"Нужно право на просмотр агентов"}
        />
      </Container>
    );
  }

  return (
    <Container>
      <FlatList
        data={vm.agents}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={vm}
        contentContainerStyle={styles.content}
        refreshing={vm.isRefreshing}
        onRefresh={vm.reload}
        ListHeaderComponent={
          <Col gap={12}>
            <AgentAlertsCard
              alerts={vm.alerts.slice(0, ALERTS_SHOWN)}
              withAgent
            />
            <TextField
              size={"small"}
              placeholder={"Поиск по имени, адресу, меткам"}
              value={vm.query}
              onChangeText={vm.setQuery}
              clearable
              iconName={"search"}
              autoCapitalize={"none"}
              autoCorrect={false}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {FILTERS.map(filter => (
                <Chip
                  key={filter}
                  text={AGENT_FILTER_LABELS[filter]}
                  isActive={vm.filter === filter}
                  onPress={() => vm.setFilter(filter)}
                />
              ))}
            </ScrollView>
          </Col>
        }
        ListEmptyComponent={
          <ScreenState
            isLoading={vm.isLoading}
            error={vm.error?.message}
            onRetry={vm.reload}
            isEmpty
            empty={{
              icon: "server",
              title: vm.total ? "Ничего не найдено" : "Агентов пока нет",
              description: vm.canEnroll
                ? "Установите агента на узел — он сам выйдет на связь"
                : "Агенты появятся, когда их установят на узлы",
            }}
          />
        }
      />
      <ActionSheet<TAgentMenuAction>
        ref={sheetRef}
        title={selected?.name}
        items={items}
        onSelect={onSelect}
      />
      <InstallAgentModal vm={vm.install} />
    </Container>
  );
});

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  chips: { gap: 8 },
});
