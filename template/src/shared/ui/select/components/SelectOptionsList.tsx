import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useEvent } from "@shared/lib/hooks";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";

import { TBottomSheetContentProps } from "../../bottom-sheet";
import { Col } from "../../flex-view";
import { Spinner } from "../../spinner";
import { useLoadMore } from "../hooks";
import type { SelectValue } from "../types";
import { isNearScrollEnd, mapOptionIndexToRow } from "../utils";
import { hasListContent, ISelectListModel } from "./select-list-model";
import { SelectListRow } from "./SelectListRow";
import { SelectListStatus } from "./SelectListStatus";

type TScrollView = React.ComponentRef<typeof BottomSheetScrollView>;

export interface ISelectOptionsListProps<V extends SelectValue> {
  model: ISelectListModel<V>;
  /** Пропсы контент-слота шторки (bounces, keyboardShouldPersistTaps). */
  scrollProps: Partial<
    Omit<TBottomSheetContentProps, "onContentSizeChange" | "children">
  >;
  /** Естественная высота контента списка. */
  onContentHeight: (height: number) => void;
}

/** Список шторки без виртуализации: скролл gorhom, все строки сразу. */
export const SelectOptionsList = <V extends SelectValue>({
  model,
  scrollProps,
  onContentHeight,
}: ISelectOptionsListProps<V>) => {
  const scrollRef = useRef<TScrollView>(null);
  const metricsRef = useRef({ offset: 0, viewport: 0, content: 0 });
  const rowOffsetsRef = useRef(new Map<number, number>());
  const showRows = hasListContent(model);

  const requestMore = useLoadMore({
    onScrollEnd: model.onScrollEnd,
    hasMore: model.hasMore,
    loading: model.loading,
    loadingMore: model.loadingMore,
    resetKey: model.rows.length,
  });

  const checkEnd = useEvent(() => {
    if (showRows && isNearScrollEnd(metricsRef.current)) requestMore();
  });

  const rowByOption = useMemo(
    () => mapOptionIndexToRow(model.rows),
    [model.rows],
  );

  const { scrollToIndexRef } = model;

  useLayoutEffect(() => {
    scrollToIndexRef.current = (index: number) => {
      const row = rowByOption.get(index);
      const y = row === undefined ? undefined : rowOffsetsRef.current.get(row);

      if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: true });
    };

    return () => {
      scrollToIndexRef.current = null;
    };
  }, [scrollToIndexRef, rowByOption]);

  const handleScroll = useEvent(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      metricsRef.current.offset = nativeEvent.contentOffset.y;
      checkEnd();
    },
  );

  const handleLayout = useEvent((event: LayoutChangeEvent) => {
    metricsRef.current.viewport = event.nativeEvent.layout.height;
    checkEnd();
  });

  const handleContentSizeChange = useEvent((_width: number, height: number) => {
    metricsRef.current.content = height;
    onContentHeight(height);
    checkEnd();
  });

  return (
    <BottomSheetScrollView
      ref={scrollRef}
      {...scrollProps}
      style={styles.scroll}
      onScroll={model.onScrollEnd ? handleScroll : undefined}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
    >
      <Col gap={4} pb={8}>
        {showRows ? (
          model.rows.map((row, index) => (
            <View
              key={row.key}
              onLayout={event =>
                rowOffsetsRef.current.set(index, event.nativeEvent.layout.y)
              }
            >
              <SelectListRow<V> row={row} model={model} />
            </View>
          ))
        ) : (
          <SelectListStatus<V> model={model} />
        )}
        {showRows && model.loadingMore && (
          <View style={styles.more}>
            <Spinner size={20} />
          </View>
        )}
      </Col>
    </BottomSheetScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexShrink: 1,
  },
  more: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
