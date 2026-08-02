import type {
  LegendListRef,
  LegendListRenderItemProps,
  ViewToken,
} from "@legendapp/list/react-native";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import React, { forwardRef, memo, useMemo } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, { AnimatedRef, AnimatedStyle } from "react-native-reanimated";

import { ChatRow, chatRowKey } from "../data";
import { ChatRowView } from "./ChatRowView";

/**
 * Список чата на `@legendapp/list`. Компонент намеренно «глупый»: про якоря,
 * пагинацию и непрочитанные он не знает, всё приходит колбэками сверху.
 *
 * Позиционирование держится на трёх вещах:
 * - `alignItemsAtEnd` — короткий контент прижат к низу;
 * - `maintainVisibleContentPosition: { data, size }` — компенсация вставки
 *   сверху и стабилизация высот при обновлении контента, без кадра
 *   с «дёрнувшимся» контентом;
 * - распорка `bottomSpacerStyle` вместо инсета; её ведёт тот же `bottomInset`,
 *   что двигает панель ввода, поэтому список и панель не могут разъехаться.
 *
 * Взят `AnimatedLegendList`, а не `KeyboardAwareLegendList`: последний
 * подписывается на клавиатуру сам и становится вторым источником движения.
 */

export interface IChatListProps {
  rows: ChatRow[];

  /** Скролл-ref компенсации: на него уходит `scrollTo` с UI-потока. */
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Распорка нижней зоны (панель ввода + клавиатура + отступы чата). */
  bottomSpacerStyle: AnimatedStyle<{ height: number }>;

  contentPaddingTop: number;
  /** Начальная позиция — якорь либо конец списка. */
  initialScrollIndex?: {
    index: number;
    viewPosition: number;
    viewOffset: number;
  };
  initialScrollAtEnd: boolean;
  /** Средняя высота строки — подсказка для первого кадра. */
  estimatedItemSize: number;
  /** Дистанция предрендера. */
  drawDistance: number;

  onLoad: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollEnd: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
  onViewableItemsChanged: (info: {
    viewableItems: ViewToken<ChatRow>[];
  }) => void;
  /** Пересборка строк при смене темы/лейаута. */
  extraData: unknown;
}

const keyExtractor = (row: ChatRow) => chatRowKey(row);
const getItemType = (row: ChatRow) => row.type;

/**
 * Обязан быть стабильным и без замыканий на данные: список зовёт его лениво и
 * только для контейнеров, чей элемент изменился.
 */
const renderItem = ({ item }: LegendListRenderItemProps<ChatRow>) => (
  <ChatRowView row={item} />
);

/** Строки неизменных сообщений приходят тем же объектом — сравниваем по ссылке. */
const itemsAreEqual = (previous: ChatRow, next: ChatRow) => previous === next;

/**
 * Ячейки держат внутреннее состояние (проигрывание голоса, подсветка, скрытие
 * под распад), поэтому переиспользование React-элементов выключено.
 */
const RECYCLE_ITEMS = false;

export const ChatList = memo(
  forwardRef<LegendListRef, IChatListProps>(
    (
      {
        rows,
        scrollRef,
        bottomSpacerStyle,
        contentPaddingTop,
        initialScrollIndex,
        initialScrollAtEnd,
        estimatedItemSize,
        drawDistance,
        onLoad,
        onScroll,
        onScrollBeginDrag,
        onScrollEndDrag,
        onMomentumScrollEnd,
        onLayout,
        onContentSizeChange,
        onViewableItemsChanged,
        extraData,
      },
      ref,
    ) => {
      const contentContainerStyle = useMemo(
        () => ({ paddingTop: contentPaddingTop }),
        [contentPaddingTop],
      );

      // Позицию держит сам список.
      const maintainVisibleContentPosition = useMemo(
        () => ({ data: true, size: true }),
        [],
      );

      // Нижняя зона — последним элементом контента, а не инсетом: так она
      // входит в размер контента, и scrollToEnd/автоскролл считаются верно.
      const listFooter = useMemo(
        () => <Animated.View style={bottomSpacerStyle} />,
        [bottomSpacerStyle],
      );

      return (
        <AnimatedLegendList
          ref={ref}
          refScrollView={
            scrollRef as unknown as React.Ref<
              React.ElementRef<typeof Animated.ScrollView>
            >
          }
          data={rows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          itemsAreEqual={itemsAreEqual}
          extraData={extraData}
          recycleItems={RECYCLE_ITEMS}
          estimatedItemSize={estimatedItemSize}
          drawDistance={drawDistance}
          alignItemsAtEnd
          maintainVisibleContentPosition={maintainVisibleContentPosition}
          initialScrollIndex={initialScrollIndex}
          initialScrollAtEnd={initialScrollAtEnd}
          ListFooterComponent={listFooter}
          contentContainerStyle={contentContainerStyle}
          style={ss.list}
          showsVerticalScrollIndicator
          // Контент и панель едут за пальцем покадрово (interactive-режим).
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onLoad={onLoad}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onLayout={onLayout}
          onContentSizeChange={onContentSizeChange}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      );
    },
  ),
);

ChatList.displayName = "ChatList";

const ss = StyleSheet.create({
  list: {
    flex: 1,
  },
});
