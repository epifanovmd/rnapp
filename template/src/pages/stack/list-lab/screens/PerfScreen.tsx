import type {
  IAnchorListRenderItemProps,
  IAnchorListStickyConfig,
} from "@epifanovmd/anchor-list";
import { anchorListPerf, useAnchorListPerf } from "@epifanovmd/anchor-list";
import { AnchorList } from "@epifanovmd/anchor-list";
import { Container, Navbar } from "@shared/ui";
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

  useAnchorListPerf("наш");

  const sticky = useMemo<IAnchorListStickyConfig<LabRow>[]>(
    () => [{ edge: "start", indices: dateIndices }],
    [dateIndices],
  );

  const renderItem = useCallback(
    ({ item }: IAnchorListRenderItemProps<LabRow>) => {
      anchorListPerf.count("renderItem");

      return <LabRowView row={item} />;
    },
    [],
  );

  return (
    <Container>
      <Navbar title={"Производительность"} safeArea>
        <Navbar.BackButton />
      </Navbar>

      <AnchorList
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
