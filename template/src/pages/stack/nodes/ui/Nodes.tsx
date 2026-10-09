import { AssignNodeOwnerModal } from "@features/assign-node-owner";
import { NodeFormModal } from "@features/manage-node";
import { ProvisionNodeAgentModal } from "@features/provision-node-agent";
import type { NodeDto } from "@shared/api/gen/main/model";
import { useLatestRef } from "@shared/lib/hooks";
import { useNavigation } from "@shared/lib/navigation";
import {
  ActionSheet,
  BottomSheet,
  Col,
  Container,
  EmptyState,
  NavbarIcon,
  Row,
  ScreenState,
  Segmented,
  type SegmentedOption,
  Text,
  TextField,
  Touchable,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { FlatList, ListRenderItem, StyleSheet } from "react-native";

import {
  nodeListActionItems,
  type TNodeListAction,
} from "../model/node-actions";
import { useNodesVM } from "../model/useNodesVM";
import { NodeCard } from "./NodeCard";
import { NodeMeshStrip } from "./NodeMeshStrip";

const keyExtractor = (node: NodeDto) => node.id;

type TScope = "all" | "mine";

const SCOPE_OPTIONS: SegmentedOption<TScope>[] = [
  { value: "all", label: "Все" },
  { value: "mine", label: "Мои" },
];

/** Узлы: сводка, связность, поиск, карточки с нагрузкой, создание и действия. */
export const Nodes: FC = observer(() => {
  const vm = useNodesVM();
  const vmRef = useLatestRef(vm);
  const navigation = useNavigation();
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<NodeDto | null>(null);
  const { canCreate } = vm;
  const openCreate = vm.form.openCreate;

  useEffect(() => {
    navigation.setOptions({
      headerRight: canCreate
        ? () => (
            <Touchable
              onPress={openCreate}
              accessibilityRole={"button"}
              accessibilityLabel={"Новый узел"}
            >
              <NavbarIcon name={"plus"} size={22} />
            </Touchable>
          )
        : undefined,
    });
  }, [navigation, canCreate, openCreate]);

  const openNode = useCallback(
    (node: NodeDto) => navigation.navigate("NodeDetail", { nodeId: node.id }),
    [navigation],
  );

  const openActions = useCallback((node: NodeDto) => {
    setSelected(node);
    sheetRef.current?.present();
  }, []);

  const onSelectAction = (key: TNodeListAction) => {
    if (!selected) return;

    if (key === "provision") vm.provision.openFor(selected);
    else if (key === "uninstall") vm.provision.openFor(selected, "uninstall");
    else if (key === "owner") vm.owner.openFor(selected);
    else if (key === "edit") vm.form.openEdit(selected);
    else vm.remove(selected);
  };

  const actionItems = selected
    ? nodeListActionItems(selected, vm.accessOf(selected))
    : [];

  const renderItem = useCallback<ListRenderItem<NodeDto>>(
    ({ item }) => {
      const current = vmRef.current;
      const hasMenu =
        nodeListActionItems(item, current.accessOf(item)).length > 0;

      return (
        <NodeCard
          node={item}
          load={current.loadOf(item)}
          onPress={openNode}
          onActions={hasMenu ? openActions : undefined}
        />
      );
    },
    [openActions, openNode, vmRef],
  );

  const header = (
    <Col gap={12}>
      <Row gap={8}>
        <Text textStyle={"Caption_M1"} color={"textSecondary"}>
          {[
            `всего ${vm.counts.total}`,
            `на связи ${vm.counts.online}`,
            vm.counts.offline > 0 && `без связи ${vm.counts.offline}`,
            vm.counts.error > 0 && `с ошибкой ${vm.counts.error}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </Row>
      {!!vm.mesh && <NodeMeshStrip mesh={vm.mesh} />}
      <TextField
        size={"small"}
        placeholder={"Поиск по названию, адресу, описанию"}
        value={vm.filter.query}
        onChangeText={vm.setQuery}
        clearable
        iconName={"search"}
        autoCapitalize={"none"}
        autoCorrect={false}
      />
      {vm.canViewAll && (
        <Segmented
          options={SCOPE_OPTIONS}
          value={vm.filter.mine ? "mine" : "all"}
          onValueChange={value => vm.setMine(value === "mine")}
        />
      )}
    </Col>
  );

  if (!vm.canView) {
    return (
      <Container>
        <EmptyState
          icon={"lock"}
          title={"Нет доступа"}
          description={"Нужно право на просмотр узлов"}
        />
      </Container>
    );
  }

  return (
    <Container>
      <FlatList
        data={vm.nodes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={vm}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        refreshing={vm.isRefreshing}
        onRefresh={vm.reload}
        ListEmptyComponent={
          <ScreenState
            isLoading={vm.isLoading}
            error={vm.error?.message}
            onRetry={vm.reload}
            isEmpty
            empty={{
              icon: "server",
              title:
                vm.filter.query || vm.filter.mine
                  ? "Ничего не найдено"
                  : "Узлов пока нет",
              description:
                "Машины с агентом: статус, связность, нагрузка, установка агента",
            }}
          />
        }
      />
      <ActionSheet<TNodeListAction>
        ref={sheetRef}
        title={selected?.name}
        items={actionItems}
        onSelect={onSelectAction}
      />
      <NodeFormModal vm={vm.form} />
      <AssignNodeOwnerModal vm={vm.owner} />
      <ProvisionNodeAgentModal vm={vm.provision} />
    </Container>
  );
});

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
});
