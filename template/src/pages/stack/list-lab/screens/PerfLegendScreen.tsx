import { LegendList } from "@legendapp/list/react-native";
import { listPerf, useListPerf } from "@shared/lib/list-perf";
import { Container, Navbar } from "@shared/ui";
import React, { FC, useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
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
 *
 * Замер тот же и в тех же единицах; внутренности чужого списка недоступны,
 * поэтому в логе только общие числа: кадры, скролл и рендеры строк.
 */
export const PerfLegendScreen: FC = () => {
  const { rows, onStartReached, onEndReached } = usePerfPagination();
  const lastOffset = useRef(0);

  useListPerf("legend");

  const renderItem = useCallback(({ item }: { item: LabRow }) => {
    listPerf.count("renderItem");

    return <LabRowView row={item} />;
  }, []);

  // Пройденное расстояние — общий знаменатель для сравнения: без него числа
  // двух стендов зависят от того, насколько сильно качнули список рукой.
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;

      listPerf.count("scrollEvents");
      listPerf.sample("scrollPx", Math.abs(offset - lastOffset.current));
      lastOffset.current = offset;
    },
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
