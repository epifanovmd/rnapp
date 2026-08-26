import React, { ComponentType, memo, useCallback, useMemo } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

import { getStickyOffset, isListDebugEnabled, listDebug } from "../core";
import { useListSignals } from "../hooks";
import {
  POSITION_OUT_OF_VIEW,
  useListRuntime,
  useListScrollOffset,
  useListSticky,
} from "../model";
import type { IListRenderItemProps } from "../types";

interface IListItemContainerProps {
  /** Индекс контейнера в пуле, а не индекс элемента данных. */
  id: number;
  renderItem: (props: IListRenderItemProps<unknown>) => React.ReactNode;
  extraData: unknown;
  ItemSeparatorComponent?: ComponentType<unknown> | null;
}

/**
 * Контейнер одного элемента.
 *
 * Единица монтирования: при переиспользовании меняются пропы, а поддерево
 * остаётся. Позиция приходит адресным сигналом, поэтому скролл перерисовывает
 * только те контейнеры, что реально сместились.
 *
 * Прилипание считается на UI-потоке и применяется двумя способами: к самому
 * контейнеру (заголовки) либо отдаётся в ячейку смещением, чтобы та подвинула
 * только нужный узел (аватар группы).
 */
export const ListItemContainer = memo<IListItemContainerProps>(
  ({ id, renderItem, extraData, ItemSeparatorComponent }) => {
    const runtime = useListRuntime();
    const scrollOffset = useListScrollOffset();
    const stickyConfigs = useListSticky();

    const signalNames = useMemo(
      () =>
        [
          `containerPosition${id}`,
          `containerItemKey${id}`,
          `containerItemIndex${id}`,
          `containerItemData${id}`,
          `containerItemSize${id}`,
          `containerSticky${id}`,
          `containerStickyLimit${id}`,
          "scrollLength",
        ] as const,
      [id],
    );

    const [
      position,
      itemKey,
      itemIndex,
      itemData,
      itemSize,
      stickyEdge,
      stickyLimit,
      scrollLength,
    ] = useListSignals(signalNames);

    const config = stickyConfigs.find(item => item.edge === stickyEdge);
    const edgeOffset = config?.offset;
    const mode = config?.mode ?? "container";

    const resolvedPosition = position ?? POSITION_OUT_OF_VIEW;
    const resolvedSize = itemSize ?? 0;
    const resolvedScrollLength = scrollLength ?? 0;
    const stickyObjectSize = config?.size ?? resolvedSize;

    /** Смещение прилипания; у обычной строки — 0. */
    const offset = useDerivedValue(() => {
      if (!stickyEdge) return 0;

      // Контейнер уведён за пределы контента и ждёт новой привязки. Формула
      // прилипания вернула бы для него позицию ровно на кромке — на экране это
      // вторая копия прилипшего элемента, срывающаяся при снятии флага.
      if (resolvedPosition <= OUT_OF_VIEW_THRESHOLD) return 0;

      return getStickyOffset({
        edge: stickyEdge,
        position: resolvedPosition,
        size: resolvedSize,
        scrollLength: resolvedScrollLength,
        scroll: scrollOffset.value,
        edgeOffset: edgeOffset?.value ?? 0,
        limit: stickyLimit,
        stickySize: stickyObjectSize,
      });
    }, [
      stickyEdge,
      resolvedPosition,
      resolvedSize,
      resolvedScrollLength,
      stickyLimit,
      stickyObjectSize,
    ]);

    // Флаг захватывается на момент создания реакции: без него каждый кадр
    // прилипания уходил бы переход в JS ради выключенного лога.
    const debugSticky = isListDebugEnabled("sticky");

    const reportOffset = useCallback(
      (value: number, scroll: number) => {
        // Позиция объекта и границы — по ним видно, вышел ли он за свою группу.
        listDebug("sticky", "смещение", {
          id,
          index: itemIndex ?? -1,
          offset: value,
          scroll,
          position: resolvedPosition,
          size: resolvedSize,
          limit: stickyLimit ?? -1,
          objectSize: stickyObjectSize,
          bottom: resolvedPosition + resolvedSize + value,
        });
      },
      [
        id,
        itemIndex,
        resolvedPosition,
        resolvedSize,
        stickyLimit,
        stickyObjectSize,
      ],
    );

    useAnimatedReaction(
      () => offset.value,
      (current, previous) => {
        if (!debugSticky) return;
        if (previous !== null && Math.abs(current - previous) < 0.5) return;

        runOnJS(reportOffset)(current, scrollOffset.value);
      },
      [debugSticky, reportOffset],
    );

    const stickyStyle = useAnimatedStyle(
      () => ({
        transform: [{ translateY: mode === "container" ? offset.value : 0 }],
      }),
      [mode],
    );

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        if (itemKey === undefined) return;

        runtime.setItemSize(itemKey, event.nativeEvent.layout.height);
      },
      [runtime, itemKey],
    );

    const style = useMemo(
      // Поверх соседей идёт только то, что реально проезжает мимо них: строка,
      // остающаяся на месте, перекрывала бы прилипший заголовок.
      () => [
        styles.container,
        { top: resolvedPosition },
        stickyEdge && mode === "container" ? styles.sticky : null,
      ],
      [resolvedPosition, stickyEdge, mode],
    );

    if (itemKey === undefined || itemIndex === undefined) return null;

    const content = (
      <>
        {renderItem({
          item: itemData,
          index: itemIndex,
          type: "",
          extraData,
          stickyOffset: mode === "offset" ? offset : undefined,
        })}
        {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
      </>
    );

    // Прилипающий контейнер двигается на UI-потоке; обычный — статичен, и
    // лишний анимированный узел ему не нужен.
    if (stickyEdge && mode === "container") {
      return (
        <Animated.View style={[style, stickyStyle]} onLayout={handleLayout}>
          {content}
        </Animated.View>
      );
    }

    return (
      <View style={style} onLayout={handleLayout}>
        {content}
      </View>
    );
  },
);

ListItemContainer.displayName = "ListItemContainer";

/** Ниже этой позиции контейнер считается уведённым за пределы контента. */
const OUT_OF_VIEW_THRESHOLD = POSITION_OUT_OF_VIEW / 2;

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  // Прилипший элемент идёт поверх соседей, мимо которых он проезжает.
  sticky: { zIndex: 1 },
});
