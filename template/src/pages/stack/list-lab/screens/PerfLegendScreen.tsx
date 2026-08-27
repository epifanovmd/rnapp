import { LegendList } from "@legendapp/list/react-native";
import { Container, Navbar } from "@shared/ui";
import React, { FC, useCallback } from "react";
import { StyleSheet } from "react-native";

import { LabRowView } from "../components";
import type { LabRow } from "../model";
import { labRowKey, labRowType, usePerfPagination } from "../model";

const ESTIMATED_ITEM_SIZE = 92;

/**
 * Тот же стенд на `@legendapp/list`.
 *
 * Данные, строки и поведение подгрузки общие с соседним стендом — иначе
 * сравнивать нечего. Отличается только сам список.
 */
export const PerfLegendScreen: FC = () => {
  const { rows, onStartReached, onEndReached } = usePerfPagination();

  const renderItem = useCallback(
    ({ item }: { item: LabRow }) => <LabRowView row={item} />,
    [],
  );

  return (
    <Container>
      <Navbar title={"Производительность · legend"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <LegendList
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        maintainVisibleContentPosition
        onStartReached={onStartReached}
        onStartReachedThreshold={0.4}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        recycleItems
        style={ss.list}
      />
    </Container>
  );
};

PerfLegendScreen.displayName = "PerfLegendScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
