import type {
  LegendListRef,
  LegendListRenderItemProps,
  ViewabilityConfigCallbackPairs,
} from "@legendapp/list/react-native";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import React, { forwardRef, memo, useMemo } from "react";
import { LayoutChangeEvent, Platform, StyleSheet } from "react-native";
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  SharedValue,
} from "react-native-reanimated";

import { ChatRow } from "../data";
import { ChatAdaptiveRenderMode } from "../model";
import { ChatRowView } from "./ChatRowView";
import { LOADING_ROW_HEIGHT } from "./LoadingRow";

/** Список чата: позиционирование и видимость считает LegendList, нижняя зона — распорка в футере. */
export interface IChatListProps {
  rows: ChatRow[];
  stickyIndices: number[];

  scrollRef: AnimatedRef<Animated.ScrollView>;
  bottomSpacerStyle: AnimatedStyle<{ height: number }>;

  scrollOffset: SharedValue<number>;
  isNearEnd: SharedValue<boolean>;
  activeStickyIndex: SharedValue<number>;

  contentPaddingTop: number;
  stickyOffset: number;
  initialScrollIndex?: {
    index: number;
    viewPosition: number;
    viewOffset: number;
  };
  estimatedItemSize: number;
  drawDistance: number;

  startReachedThreshold: number;
  endReachedThreshold: number;
  maintainScrollAtEndThreshold: number;
  autoScrollOnNewMessage: boolean;

  viewabilityConfigCallbackPairs: ViewabilityConfigCallbackPairs<ChatRow>;

  onLoad: () => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onStartReached: () => void;
  onEndReached: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
  onAdaptiveRenderChange: (mode: ChatAdaptiveRenderMode) => void;
}

const keyExtractor = (row: ChatRow) => row.key;
const getItemType = (row: ChatRow) => row.itemType;

// Только у спиннера загрузки фиксированная высота — остальные строки меряются.
const getFixedItemSize = (row: ChatRow) =>
  row.type === "loading" ? LOADING_ROW_HEIGHT : undefined;

const renderItem = ({ item, index }: LegendListRenderItemProps<ChatRow>) => (
  <ChatRowView row={item} index={index} />
);

const itemsAreEqual = (previous: ChatRow, next: ChatRow) => previous === next;
const RECYCLE_ITEMS = true;
const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: true, size: true };

// Только dataChange: footerLayout — второй источник сдвига.
const MAINTAIN_SCROLL_AT_END = { animated: true, on: { dataChange: true } };

// 120 мс вместо дефолтных 250 — иначе серые плитки на месте картинок при быстром скролле.
const ADAPTIVE_RENDER_EXIT_DELAY = 120;

export const ChatList = memo(
  forwardRef<LegendListRef, IChatListProps>(
    (
      {
        rows,
        stickyIndices,
        scrollRef,
        bottomSpacerStyle,
        scrollOffset,
        isNearEnd,
        activeStickyIndex,
        contentPaddingTop,
        stickyOffset,
        initialScrollIndex,
        estimatedItemSize,
        drawDistance,
        startReachedThreshold,
        endReachedThreshold,
        maintainScrollAtEndThreshold,
        autoScrollOnNewMessage,
        viewabilityConfigCallbackPairs,
        onLoad,
        onScrollBeginDrag,
        onScrollEndDrag,
        onStartReached,
        onEndReached,
        onLayout,
        onContentSizeChange,
        onAdaptiveRenderChange,
      },
      ref,
    ) => {
      const adaptiveRender = useMemo(
        () => ({
          exitDelay: ADAPTIVE_RENDER_EXIT_DELAY,
          onChange: onAdaptiveRenderChange,
        }),
        [onAdaptiveRenderChange],
      );

      const contentContainerStyle = useMemo(
        () => ({ paddingTop: contentPaddingTop }),
        [contentPaddingTop],
      );

      const sharedValues = useMemo(
        () => ({
          scrollOffset,
          activeStickyIndex,
          // LegendList считает `isNearEnd` по порогу пагинации. Для чата
          // состояние «у низа» должно жить на отдельном scroll-пороге.
          isWithinMaintainScrollAtEndThreshold: isNearEnd,
        }),
        [scrollOffset, isNearEnd, activeStickyIndex],
      );

      const stickyHeaderConfig = useMemo(
        () => ({ offset: stickyOffset }),
        [stickyOffset],
      );

      const listFooter = useMemo(
        () => <Animated.View style={bottomSpacerStyle} />,
        [bottomSpacerStyle],
      );

      return (
        <AnimatedLegendList
          ref={ref}
          refScrollView={
            scrollRef as unknown as React.Ref<
              React.ComponentRef<typeof Animated.ScrollView>
            >
          }
          data={rows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          getFixedItemSize={getFixedItemSize}
          itemsAreEqual={itemsAreEqual}
          recycleItems={RECYCLE_ITEMS}
          experimental_adaptiveRender={adaptiveRender}
          estimatedItemSize={estimatedItemSize}
          drawDistance={drawDistance}
          alignItemsAtEnd
          maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
          maintainScrollAtEnd={
            autoScrollOnNewMessage ? MAINTAIN_SCROLL_AT_END : false
          }
          maintainScrollAtEndThreshold={maintainScrollAtEndThreshold}
          initialScrollIndex={initialScrollIndex}
          initialScrollAtEnd={initialScrollIndex == null}
          stickyHeaderIndices={stickyIndices}
          stickyHeaderConfig={stickyHeaderConfig}
          sharedValues={sharedValues}
          ListFooterComponent={listFooter}
          contentContainerStyle={contentContainerStyle}
          style={ss.list}
          showsVerticalScrollIndicator
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onStartReached={onStartReached}
          onStartReachedThreshold={startReachedThreshold}
          onEndReached={onEndReached}
          onEndReachedThreshold={endReachedThreshold}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          onLoad={onLoad}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onLayout={onLayout}
          onContentSizeChange={onContentSizeChange}
        />
      );
    },
  ),
);

ChatList.displayName = "ChatList";

const ss = StyleSheet.create({ list: { flex: 1 } });
