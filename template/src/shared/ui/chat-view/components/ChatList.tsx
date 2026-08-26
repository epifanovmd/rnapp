import type {
  LegendListRef,
  LegendListRenderItemProps,
  ViewabilityConfigCallbackPairs,
} from "@legendapp/list/react-native";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import React, { forwardRef, useMemo } from "react";
import { LayoutChangeEvent, Platform, StyleSheet } from "react-native";
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  SharedValue,
  useAnimatedProps,
} from "react-native-reanimated";

import {
  CHAT_CONTENT_PADDING,
  CHAT_DATE_SEPARATOR_ROW_HEIGHT,
} from "../config";
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
  /** Нижняя зона (панель + клавиатура): индикатор скролла заканчивается вместе с контентом. */
  indicatorBottomInset: SharedValue<number>;

  scrollOffset: SharedValue<number>;
  isNearEnd: SharedValue<boolean>;
  activeStickyIndex: SharedValue<number>;

  initialScrollIndex?: {
    index: number;
    viewPosition: number;
    viewOffset: number;
  };
  startReachedThreshold: number;
  endReachedThreshold: number;
  maintainScrollAtEndThreshold: number;

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

/** Подсказка списку для первого кадра; дальше идут реальные измерения. */
const ESTIMATED_ROW_HEIGHT = 110;

/** Насколько за пределы экрана предрендерить строки (px). */
const DRAW_DISTANCE = 300;

/** Плашка даты прилипает к самой кромке списка. */
const STICKY_HEADER_CONFIG = { offset: 0 };

export const ChatList = forwardRef<LegendListRef, IChatListProps>(
  (
    {
      rows,
      stickyIndices,
      scrollRef,
      bottomSpacerStyle,
      indicatorBottomInset,
      scrollOffset,
      isNearEnd,
      activeStickyIndex,
      initialScrollIndex,
      startReachedThreshold,
      endReachedThreshold,
      maintainScrollAtEndThreshold,
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
    // Спиннер и плашки дат имеют известную высоту — их список не меряет.
    // Кроме исчезающей плашки: схлопывание меняет высоту покадрово, а
    // фиксированный размер заставил бы список игнорировать её замеры.
    const getFixedItemSize = useMemo(
      () => (row: ChatRow) => {
        if (row.type === "loading") return LOADING_ROW_HEIGHT;
        if (row.type === "dateSeparator" && !row.removing) {
          return CHAT_DATE_SEPARATOR_ROW_HEIGHT;
        }

        return undefined;
      },
      [],
    );

    const adaptiveRender = useMemo(
      () => ({
        exitDelay: ADAPTIVE_RENDER_EXIT_DELAY,
        onChange: onAdaptiveRenderChange,
      }),
      [onAdaptiveRenderChange],
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

    const listFooter = useMemo(
      () => <Animated.View style={bottomSpacerStyle} />,
      [bottomSpacerStyle],
    );

    const indicatorInsetProps = useAnimatedProps(() => ({
      scrollIndicatorInsets: { bottom: indicatorBottomInset.value },
    }));

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
        estimatedItemSize={ESTIMATED_ROW_HEIGHT}
        drawDistance={DRAW_DISTANCE}
        alignItemsAtEnd
        maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
        maintainScrollAtEnd={MAINTAIN_SCROLL_AT_END}
        maintainScrollAtEndThreshold={maintainScrollAtEndThreshold}
        initialScrollIndex={initialScrollIndex}
        initialScrollAtEnd={initialScrollIndex == null}
        stickyHeaderIndices={stickyIndices}
        stickyHeaderConfig={STICKY_HEADER_CONFIG}
        sharedValues={sharedValues}
        ListFooterComponent={listFooter}
        contentContainerStyle={ss.content}
        style={ss.list}
        animatedProps={indicatorInsetProps}
        // iOS сам добавляет safe area к инсетам индикатора, а она уже входит
        // в indicatorBottomInset — авто-подстройка давала бы двойной отступ.
        automaticallyAdjustsScrollIndicatorInsets={false}
        showsVerticalScrollIndicator
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
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
);

ChatList.displayName = "ChatList";

const ss = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingTop: CHAT_CONTENT_PADDING },
});
