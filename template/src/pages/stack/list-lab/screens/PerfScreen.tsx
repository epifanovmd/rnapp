import { listPerf, useListPerf } from "@shared/lib/list-perf";
import { Container, Navbar } from "@shared/ui";
import type { IListRenderItemProps, IListStickyConfig } from "@shared/ui/list";
import { List } from "@shared/ui/list";
import React, { FC, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";

import { LabRowView } from "../components";
import type { LabRow } from "../model";
import { labRowKey, labRowType, usePerfPagination } from "../model";

const ESTIMATED_ITEM_SIZE = 92;

/**
 * Стенд производительности своего списка.
 *
 * Ни настроек, ни экранных счётчиков: тысяча сообщений, подгрузка в обе стороны,
 * высоты меряются, даты прилипают к верхней кромке. Всё, что могло бы повлиять
 * на замер помимо самого списка, из кадра убрано.
 *
 * Замер пишется в консоль пачкой раз в секунду, пока экран открыт; строка
 * `стики` показывает, во что обходится прилипание на каждом проходе.
 */
export const PerfScreen: FC = () => {
  const { rows, dateIndices, onStartReached, onEndReached } =
    usePerfPagination();

  useListPerf("наш");

  const sticky = useMemo<IListStickyConfig<LabRow>[]>(
    () => [{ edge: "start", indices: dateIndices }],
    [dateIndices],
  );

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
        sticky={sticky}
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
