import type {
  LegendListRef,
  LegendListRenderItemProps,
  ViewToken,
} from "@legendapp/list/react-native";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import React, { forwardRef, memo, useCallback, useMemo } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, { AnimatedRef, AnimatedStyle } from "react-native-reanimated";

import { ChatRow, chatRowKey, IParsedChatMessage } from "../model";
import { ChatRowView } from "./ChatRowView";

/**
 * Список чата на `@legendapp/list` — порт `UICollectionView` +
 * `ChatCollectionViewLayout` из `ChatViewController`.
 *
 * Соответствие эталону обеспечивают:
 *
 * - `alignItemsAtEnd` — контент короче вьюпорта прижат к низу, как у
 *   коллекции с нижней привязкой.
 * - `maintainVisibleContentPosition: { data, size }` — порт компенсации
 *   `applyPrepend` (`newTotalH - oldTotalH`) и стабилизации при изменении
 *   высоты строки в `applyContentOnly`. Обе делаются нативно и без кадра
 *   с «дёрнувшимся» контентом.
 * - распорка `bottomSpacerStyle` в конце контента — порт
 *   `updateCollectionInsets`. Зону и позицию ведёт
 *   `useScrollCompensation` из `shared/lib/keyboard` от **того же**
 *   `bottomInset`, который сдвигает панель ввода, поэтому список и панель
 *   физически не могут разъехаться (см. комментарий в самом хуке).
 *
 * Взят `AnimatedLegendList` из `@legendapp/list/reanimated`, а не
 * `KeyboardAwareLegendList`: последний подписывается на клавиатуру сам и
 * ведёт позицию своим расчётом — это второй источник движения, из-за
 * которого список отставал от панели.
 *
 * Компонент намеренно «глупый»: он не знает ни про якоря, ни про
 * пагинацию, ни про непрочитанные. Всё это приходит колбэками сверху.
 */

export interface IChatListProps {
  rows: ChatRow[];
  messageIndex: Map<string, IParsedChatMessage>;
  firstSeparatorIndex: number;
  hideFirstSeparator: boolean;

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
  /** Дистанция предрендера. Порт буфера коллекции. */
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
 * Виртуализация переиспользует контейнеры, но не сами React-элементы:
 * `recycleItems` выключен намеренно. Ячейки чата держат внутреннее
 * состояние (проигрывание голоса, подсветка, скрытие под распад), и
 * переиспользование инстансов ломало бы его при быстром скролле.
 */
const RECYCLE_ITEMS = false;

export const ChatList = memo(
  forwardRef<LegendListRef, IChatListProps>(
    (
      {
        rows,
        messageIndex,
        firstSeparatorIndex,
        hideFirstSeparator,
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
      const renderItem = useCallback(
        ({
          item,
          index,
        }: LegendListRenderItemProps<ChatRow, string | undefined>) => (
          <ChatRowView
            row={item}
            index={index}
            rows={rows}
            messageIndex={messageIndex}
            hideFirstSeparator={hideFirstSeparator}
            firstSeparatorIndex={firstSeparatorIndex}
          />
        ),
        [rows, messageIndex, hideFirstSeparator, firstSeparatorIndex],
      );

      const contentContainerStyle = useMemo(
        () => ({ paddingTop: contentPaddingTop }),
        [contentPaddingTop],
      );

      // Порт applyPrepend/applyContentOnly: позицию держит сам список.
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
          // Порт keyboardDismissMode = .interactive: контент и панель едут
          // за пальцем покадрово через onInteractive.
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
