import type {
  LegendListRef,
  LegendListRenderItemProps,
  ViewabilityConfigCallbackPairs,
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
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  SharedValue,
} from "react-native-reanimated";

import { ChatRow } from "../data";
import { ChatRowView } from "./ChatRowView";

/**
 * Список чата на `@legendapp/list`.
 *
 * Компонент намеренно «глупый»: он не считает ни позиций, ни видимости —
 * всё это умеет сам список, и задача здесь только его правильно настроить.
 *
 * - `sharedValues` отдаёт позицию скролла и признаки «у края» **в shared
 *   values**: FAB и плашка даты читают их прямо в ворклетах, минуя JS;
 * - `stickyHeaderIndices` прилепляет разделители дат к верхней кромке —
 *   это и есть плавающая дата, но считает её список, на UI-потоке;
 * - `maintainVisibleContentPosition` держит позицию при вставках сверху,
 *   `maintainScrollAtEnd` — прижимает к низу, если мы у нижнего края;
 * - `onStartReached`/`onEndReached` — пагинация с порогом в долях экрана;
 * - `viewabilityConfigCallbackPairs` — два порога сразу: снимок видимых
 *   и отметка о прочтении;
 * - распорка `bottomSpacerStyle` вместо инсета; её ведёт тот же `bottomInset`,
 *   что двигает панель ввода, поэтому список и панель не могут разъехаться.
 *
 * Взят `AnimatedLegendList`, а не `KeyboardAwareLegendList`: последний
 * подписывается на клавиатуру сам и становится вторым источником движения,
 * а нижнюю зону в этом проекте ведёт `shared/lib/keyboard`.
 */
export interface IChatListProps {
  rows: ChatRow[];
  /** Индексы разделителей дат. */
  stickyIndices: number[];

  /** Скролл-ref компенсации: на него уходит `scrollTo` с UI-потока. */
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Распорка нижней зоны (панель ввода + клавиатура + отступы чата). */
  bottomSpacerStyle: AnimatedStyle<{ height: number }>;

  /** Значения, которые список ведёт сам, — читаются из ворклетов. */
  scrollOffset: SharedValue<number>;
  isNearEnd: SharedValue<boolean>;
  activeStickyIndex: SharedValue<number>;

  contentPaddingTop: number;
  /** Отступ прилипшей плашки от верхней кромки. */
  stickyOffset: number;
  /** Начальная позиция — якорь либо конец списка. */
  initialScrollIndex?: {
    index: number;
    viewPosition: number;
    viewOffset: number;
  };
  estimatedItemSize: number;
  drawDistance: number;

  /** Пороги пагинации в долях высоты вьюпорта. */
  startReachedThreshold: number;
  endReachedThreshold: number;
  /** Доля экрана, в пределах которой список сам прижимается к низу. */
  maintainScrollAtEndThreshold: number;

  viewabilityConfigCallbackPairs: ViewabilityConfigCallbackPairs<ChatRow>;

  /** Список отрисовал первый кадр и знает реальные высоты видимых строк. */
  onLoad: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onStartReached: () => void;
  onEndReached: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
  /** Пересборка строк при смене темы/лейаута. */
  extraData: unknown;
}

const keyExtractor = (row: ChatRow) => row.key;
const getItemType = (row: ChatRow) => row.type;

/**
 * Обязан быть стабильным и без замыканий на данные: список зовёт его лениво и
 * только для контейнеров, чей элемент изменился.
 */
const renderItem = ({ item, index }: LegendListRenderItemProps<ChatRow>) => (
  <ChatRowView row={item} index={index} />
);

/** Строки неизменных сообщений приходят тем же объектом — сравниваем по ссылке. */
const itemsAreEqual = (previous: ChatRow, next: ChatRow) => previous === next;

/**
 * Ячейки держат внутреннее состояние (проигрывание голоса, подсветка), поэтому
 * переиспользование React-элементов выключено.
 */
const RECYCLE_ITEMS = false;
const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: true, size: true };
/**
 * Прижимать к низу **только** при новых данных.
 *
 * `footerLayout` включать нельзя: нижняя зона (клавиатура + панель ввода) — это
 * распорка в конце контента, и реакция на её лейаут сделала бы список вторым
 * источником сдвига рядом с `shared/lib/keyboard`. Проверено дважды: список
 * начинает лагать. `itemLayout` — по той же причине: доизмерение строк выше
 * утащило бы вниз при догрузке истории.
 */
const MAINTAIN_SCROLL_AT_END = {
  animated: true,
  on: { dataChange: true },
};

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
        viewabilityConfigCallbackPairs,
        onLoad,
        onScroll,
        onScrollBeginDrag,
        onScrollEndDrag,
        onStartReached,
        onEndReached,
        onLayout,
        onContentSizeChange,
        extraData,
      },
      ref,
    ) => {
      const contentContainerStyle = useMemo(
        () => ({ paddingTop: contentPaddingTop }),
        [contentPaddingTop],
      );

      // Нижняя зона — последним элементом контента, а не инсетом: так она
      // входит в размер контента, и прижатие к низу считается верно.
      const listFooter = useMemo(
        () => <Animated.View style={bottomSpacerStyle} />,
        [bottomSpacerStyle],
      );

      const sharedValues = useMemo(
        () => ({ scrollOffset, isNearEnd, activeStickyIndex }),
        [scrollOffset, isNearEnd, activeStickyIndex],
      );

      const stickyHeaderConfig = useMemo(
        () => ({ offset: stickyOffset }),
        [stickyOffset],
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
          itemsAreEqual={itemsAreEqual}
          extraData={extraData}
          recycleItems={RECYCLE_ITEMS}
          estimatedItemSize={estimatedItemSize}
          drawDistance={drawDistance}
          alignItemsAtEnd
          maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
          maintainScrollAtEnd={MAINTAIN_SCROLL_AT_END}
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
          // Контент и панель едут за пальцем покадрово (interactive-режим).
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
          onScroll={onScroll}
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

const ss = StyleSheet.create({
  list: { flex: 1 },
});
