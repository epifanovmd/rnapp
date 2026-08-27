import { listPerf, useListPerf } from "@shared/lib/list-perf";
import { Container, Navbar } from "@shared/ui";
import type { IListRenderItemProps } from "@shared/ui/list";
import { List } from "@shared/ui/list";
import React, { FC, useCallback } from "react";
import { StyleSheet } from "react-native";

import { LabRowView } from "../components";
import type { LabRow } from "../model";
import { labRowKey, labRowType, usePerfPagination } from "../model";

const ESTIMATED_ITEM_SIZE = 92;

/**
 * Стенд производительности своего списка.
 *
 * Ни настроек, ни счётчиков: тысяча сообщений, подгрузка в обе стороны,
 * высоты меряются. Всё, что могло бы повлиять на замер, из кадра убрано.
 *
 * Тот же список на `@legendapp/list` лежит на соседнем стенде — данные и
 * поведение подгрузки у них общие, поэтому сравнивать можно напрямую.
 *
 * Замер пишется в консоль пачкой раз в секунду, пока экран открыт.
 */
export const PerfScreen: FC = () => {
  const { rows, onStartReached, onEndReached } = usePerfPagination();

  useListPerf("наш");

  const renderItem = useCallback(({ item }: IListRenderItemProps<LabRow>) => {
    listPerf.count("renderItem");

    return <LabRowView row={item} />;
  }, []);

  return (
    <Container>
      <Navbar title={"Производительность"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <List
        data={rows}
        renderItem={renderItem}
        keyExtractor={labRowKey}
        getItemType={labRowType}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        maintainVisibleContentPosition={{ data: true, size: true }}
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

PerfScreen.displayName = "PerfScreen";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
