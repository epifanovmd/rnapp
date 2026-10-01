import {
  AnchorList,
  IAnchorListProps,
  IAnchorListRef,
  IAnchorListRenderItemProps,
  IAnchorListStickyConfig,
} from "@epifanovmd/anchor-list";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { GestureType } from "react-native-gesture-handler";

import { useBottomSheetScrollableBridge } from "../../bottom-sheet";
import { Spinner } from "../../spinner";
import { useLoadMore } from "../hooks";
import type { SelectValue, SelectVirtualConfig } from "../types";
import {
  getGroupRowIndices,
  mapOptionIndexToRow,
  type OptionRow,
} from "../utils";
import type { ISelectListModel } from "./select-list-model";
import { SelectListRow } from "./SelectListRow";

export interface ISelectVirtualListProps<V extends SelectValue> {
  model: ISelectListModel<V>;
  config: Required<SelectVirtualConfig>;
  /** Нативный жест скролла, одновременный с жестом шторки. */
  gesture: GestureType;
  /** Предел высоты списка, px. */
  maxHeight: number;
  /** Естественная высота контента списка. */
  onContentHeight: (height: number) => void;
}

const ROW_GAP = 4;

const keyExtractor = <V extends SelectValue>(row: OptionRow<V>) => row.key;
const getItemType = <V extends SelectValue>(row: OptionRow<V>) => row.kind;

/**
 * Виртуальный список шторки на AnchorList: рендерятся только видимые строки,
 * заголовки групп прилипают к верху. Скролл связан со шторкой мостом
 * `useBottomSheetScrollableBridge`. Высота задаётся явно (контент, но не выше
 * `maxHeight`): у ScrollView списка нет собственной естественной высоты.
 */
export const SelectVirtualList = <V extends SelectValue>({
  model,
  config,
  gesture,
  maxHeight,
  onContentHeight,
}: ISelectVirtualListProps<V>) => {
  const listRef = useRef<IAnchorListRef>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const { scrollRef, scrollHandlers, renderScrollView } =
    useBottomSheetScrollableBridge(gesture);
  const { rows, scrollToIndexRef } = model;

  const estimate = rows.length * (config.estimateSize + ROW_GAP);
  const height = Math.min(contentHeight ?? estimate, maxHeight);

  const rowByOption = useMemo(() => mapOptionIndexToRow(rows), [rows]);

  useLayoutEffect(() => {
    scrollToIndexRef.current = (index: number) => {
      const row = rowByOption.get(index);

      if (row !== undefined) {
        listRef.current?.scrollToIndex({
          index: row,
          animated: true,
          viewPosition: 0.5,
        });
      }
    };

    return () => {
      scrollToIndexRef.current = null;
    };
  }, [scrollToIndexRef, rowByOption]);

  const sticky = useMemo<
    IAnchorListStickyConfig<OptionRow<V>>[] | undefined
  >(() => {
    const indices = getGroupRowIndices(rows);

    return indices.length ? [{ edge: "start", indices }] : undefined;
  }, [rows]);

  const requestMore = useLoadMore({
    onScrollEnd: model.onScrollEnd,
    hasMore: model.hasMore,
    loading: model.loading,
    loadingMore: model.loadingMore,
    resetKey: rows.length,
  });

  const handleContentSizeChange = useCallback(
    (_width: number, nextHeight: number) => {
      setContentHeight(nextHeight);
      onContentHeight(nextHeight);
    },
    [onContentHeight],
  );

  const renderItem = useCallback(
    ({ item }: IAnchorListRenderItemProps<OptionRow<V>>) => (
      <SelectListRow<V> row={item} model={model} />
    ),
    [model],
  );

  return (
    <AnchorList<OptionRow<V>>
      ref={listRef}
      data={rows}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      renderItem={renderItem}
      extraData={model}
      estimatedItemSize={config.estimateSize}
      drawDistance={config.overscan * config.estimateSize}
      gap={ROW_GAP}
      footerGap={0}
      sticky={sticky}
      keyboardShouldPersistTaps={"handled"}
      // Типы reanimated у связанного пакета — своя копия; объект тот же.
      refScrollView={
        scrollRef as unknown as IAnchorListProps<unknown>["refScrollView"]
      }
      scrollHandlers={scrollHandlers}
      renderScrollView={renderScrollView}
      onContentSizeChange={handleContentSizeChange}
      onEndReached={model.onScrollEnd ? requestMore : undefined}
      ListFooterComponent={
        model.loadingMore ? (
          <View style={styles.more}>
            <Spinner size={20} />
          </View>
        ) : null
      }
      style={[styles.list, { height }]}
      contentContainerStyle={styles.content}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flexShrink: 1,
  },
  content: {
    paddingBottom: 8,
  },
  more: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
