import { KeyboardAwareLegendList } from "@legendapp/list/keyboard";
import type {
  LegendListRef,
  LegendListRenderItemProps,
  ViewabilityConfigCallbackPairs,
} from "@legendapp/list/react-native";
import React, { forwardRef, memo, useMemo } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
} from "react-native";
import { SharedValue } from "react-native-reanimated";

import { ChatRow } from "../data";
import { ChatAdaptiveRenderMode } from "../model";
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
 * - нижняя зона — **инсет**, а не распорка в конце контента: её ведёт
 *   нативный `KeyboardChatScrollView` под списком.
 *
 * Про последнее подробнее, потому что раньше здесь было наоборот. Пока панель
 * ввода была частью контента, конец списка не совпадал с видимым низом:
 * `initialScrollAtEnd` и `scrollToEnd` целились в конец контента, а не в
 * строку над панелью, реакцию `maintainScrollAtEnd` на лейаут футера
 * приходилось выключать (второй источник движения рядом с компенсацией
 * скролла), и открытие чата раз за разом промахивалось. Документация про это
 * говорит прямо: для панели, перекрывающей конец списка, — инсет, а не
 * padding контента.
 *
 * Отсюда `KeyboardAwareLegendList`: он тот же `AnimatedLegendList`, но со
 * `KeyboardChatScrollView` вместо обычного скролла. Тот сам ведёт
 * `contentInset` на высоту клавиатуры, расширяет диапазон прокрутки на
 * `contentInsetEndAdjustment` (панель + safe area) и сообщает получившийся
 * инсет списку — то есть заменяет собой и распорку, и компенсацию скролла.
 * `freeze` принимает наш shared value: заморозка под контекстное меню
 * осталась там же, где была.
 */
export interface IChatListProps {
  rows: ChatRow[];
  /** Индексы разделителей дат. */
  stickyIndices: number[];

  /**
   * Нижняя зона **без** клавиатуры: панель ввода, safe area под ней и отступы
   * чата. Высоту клавиатуры добавляет сам скролл, поэтому её здесь нет.
   */
  composerInset: SharedValue<number>;
  /** Заморозка зоны на время контекстного меню. */
  freeze: SharedValue<boolean>;

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
  onStartReached: () => void;
  onEndReached: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  /**
   * Смена режима рендера. Отдаётся наружу, а не читается ячейками через
   * `useAdaptiveRender`: копия пузыря живёт в оверлее меню, вне списка.
   */
  onAdaptiveRenderChange: (mode: ChatAdaptiveRenderMode) => void;
}

const keyExtractor = (row: ChatRow) => row.key;
// Не `row.type`: тип контейнера дробнее и посчитан заранее — см. `ChatRow`.
const getItemType = (row: ChatRow) => row.itemType;

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
 * Ячейки переиспользуются: список не пересоздаёт вью на скролле, а меняет
 * пропы у уже смонтированных — самое дорогое в ячейке (жест-детектор меню)
 * переживает прокрутку.
 *
 * Плата за это — состояние ячейки переезжает на новое сообщение. Всё, что его
 * держит, отделено React-ключом и пересоздаётся вместе со сменой сообщения:
 * подсветка (`HighlightOverlay`), голосовое (`VoiceContent`) и опрос
 * (`PollContent`); сетка вложений и файлы ключуются по url внутри себя.
 * Строки разных типов (`getItemType`) React разводит сам — там другой
 * компонент, переиспользовать нечего.
 */
const RECYCLE_ITEMS = true;
const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: true, size: true };
/**
 * Прижимать к низу при новых данных и при изменении футера.
 *
 * `footerLayout` раньше было нельзя: нижняя зона жила распоркой в конце
 * контента, и реакция на её лейаут делала список вторым источником сдвига
 * рядом с компенсацией скролла. Распорки больше нет — зона стала инсетом, —
 * поэтому флаг включён по прямой рекомендации документации: он для «chat
 * typing indicators and dynamic footers that should keep an end-pinned list at
 * the bottom».
 *
 * `itemLayout` по-прежнему выключен: доизмерение строк выше утащило бы вниз
 * при догрузке истории.
 */
const MAINTAIN_SCROLL_AT_END = {
  animated: true,
  on: { dataChange: true, footerLayout: true },
};
/**
 * Возврат к полному рендеру после броска: дефолтные 250 мс заметны как серые
 * плитки на месте картинок. Пороги скорости оставлены дефолтными.
 */
const ADAPTIVE_RENDER_EXIT_DELAY = 120;

export const ChatList = memo(
  forwardRef<LegendListRef, IChatListProps>(
    (
      {
        rows,
        stickyIndices,
        composerInset,
        freeze,
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
        onStartReached,
        onEndReached,
        onLayout,
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
        () => ({ scrollOffset, isNearEnd, activeStickyIndex }),
        [scrollOffset, isNearEnd, activeStickyIndex],
      );

      const stickyHeaderConfig = useMemo(
        () => ({ offset: stickyOffset }),
        [stickyOffset],
      );

      return (
        <KeyboardAwareLegendList
          ref={ref}
          contentInsetEndAdjustment={composerInset}
          freeze={freeze}
          data={rows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          itemsAreEqual={itemsAreEqual}
          recycleItems={RECYCLE_ITEMS}
          experimental_adaptiveRender={adaptiveRender}
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
          onLayout={onLayout}
        />
      );
    },
  ),
);

ChatList.displayName = "ChatList";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
