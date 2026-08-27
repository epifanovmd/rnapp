import React, { ComponentType, memo, useCallback, useMemo } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";

import {
  getStickyOffset,
  isListDebugEnabled,
  isPinnedAtEdge,
  listDebug,
} from "../core";
import { useListSignals } from "../hooks";
import {
  POSITION_OUT_OF_VIEW,
  useListRuntime,
  useListScrollOffset,
  useListSticky,
  useListStickyPinned,
} from "../model";
import type { IListRenderItemProps } from "../types";
import { getContainerSignalNames } from "./container-signals";
import { isContainerParked, resolveStickyPlacement } from "./sticky-placement";

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
 * Измеряется внутренний узел, а не сам контейнер: подрезанному контейнеру
 * высота задаётся по метрикам, и его собственный размер тогда говорит не о
 * содержимом, а о том, что списку и так известно.
 *
 * Ключ элемента стоит на этом узле намеренно. Событие раскладки доставляется в
 * JS асинхронно, и без ключа узел переживает смену элемента — тогда высота
 * прежнего содержимого записывается под новый ключ, а это ложный размер и
 * лишний сдвиг компенсации. С ключом узел перемонтируется, событие от старого
 * содержимого не доходит, а новое приходит гарантированно — даже если высота
 * совпала.
 *
 * Прилипание считается на UI-потоке и применяется двумя способами: к самому
 * контейнеру (заголовки) либо отдаётся в ячейку смещением, чтобы та подвинула
 * только нужный узел (аватар группы).
 *
 * Узел контейнера всегда анимированный, даже у обычной строки. Смена типа узла
 * при получении кромки перемонтировала бы поддерево ячейки, а новый
 * анимированный узел коммитится с базовым стилем — снятым при его первом
 * рендере, то есть с нулевым смещением. На экране это срыв прилипшего элемента
 * на кадр и возврат обратно.
 */
export const ListItemContainer = memo<IListItemContainerProps>(
  ({ id, renderItem, extraData, ItemSeparatorComponent }) => {
    const runtime = useListRuntime();
    const scrollOffset = useListScrollOffset();
    const stickyConfigs = useListSticky();
    const pinnedIndices = useListStickyPinned();

    const signalNames = useMemo(() => getContainerSignalNames(id), [id]);

    const [
      position,
      itemKey,
      itemIndex,
      itemData,
      itemSize,
      stickyEdge,
      stickyLimit,
      clipped,
      scrollLength,
    ] = useListSignals(signalNames);

    const resolvedPosition = position ?? POSITION_OUT_OF_VIEW;
    const resolvedSize = itemSize ?? 0;
    const resolvedScrollLength = scrollLength ?? 0;

    const { mode, edgeOffset, stickySize, hasOverlay } = resolveStickyPlacement(
      stickyConfigs,
      stickyEdge,
      resolvedSize,
    );

    listDebug("render", "контейнер", {
      id,
      index: itemIndex ?? -1,
      key: itemKey ?? "-",
      sticky: stickyEdge ?? "-",
      position: resolvedPosition,
      clipped: clipped ?? false,
    });

    /** Смещение прилипания; у обычной строки — 0. */
    const offset = useDerivedValue(() => {
      if (!stickyEdge) return 0;
      if (isContainerParked(resolvedPosition)) return 0;

      return getStickyOffset({
        edge: stickyEdge,
        position: resolvedPosition,
        size: resolvedSize,
        scrollLength: resolvedScrollLength,
        scroll: scrollOffset.value,
        edgeOffset: edgeOffset?.value ?? 0,
        limit: stickyLimit,
        stickySize,
      });
    }, [
      stickyEdge,
      resolvedPosition,
      resolvedSize,
      resolvedScrollLength,
      stickyLimit,
      stickySize,
    ]);

    /**
     * Прилипшую копию сейчас рисует слой поверх списка.
     *
     * Пока это так, узел внутри контента прячется: он остаётся на месте для
     * касаний, но на кромке не должно стоять двух одинаковых элементов.
     */
    const pinnedByOverlay = useDerivedValue(() => {
      if (!stickyEdge || !hasOverlay) return false;
      if (isContainerParked(resolvedPosition)) return false;

      const rendered =
        stickyEdge === "start"
          ? pinnedIndices.start.value
          : pinnedIndices.end.value;

      // Прятаться можно только под уже нарисованную копию — иначе на стыке
      // якорей остаётся кадр, где не нарисован ни один из двух.
      if (rendered !== itemIndex) return false;

      return isPinnedAtEdge({
        edge: stickyEdge,
        position: resolvedPosition,
        size: resolvedSize,
        scrollLength: resolvedScrollLength,
        scroll: scrollOffset.value,
        edgeOffset: edgeOffset?.value ?? 0,
        limit: stickyLimit,
        stickySize,
      });
    }, [
      stickyEdge,
      hasOverlay,
      itemIndex,
      resolvedPosition,
      resolvedSize,
      resolvedScrollLength,
      stickyLimit,
      stickySize,
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
          objectSize: stickySize,
          bottom: resolvedPosition + resolvedSize + value,
          // Экранная позиция прилипшего узла: пока он у кромки, она обязана
          // стоять на месте от кадра к кадру.
          screen: resolvedPosition + value - scroll,
        });
      },
      [id, itemIndex, resolvedPosition, resolvedSize, stickyLimit, stickySize],
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
        opacity: mode === "container" && pinnedByOverlay.value ? 0 : 1,
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
        // Высота фиксируется по метрикам: пока строка вне вьюпорта, её
        // содержимое не должно въезжать в кадр, даже если оно выросло.
        clipped ? { height: resolvedSize, overflow: "hidden" as const } : null,
        stickyEdge && mode === "container" ? styles.sticky : null,
      ],
      [resolvedPosition, resolvedSize, clipped, stickyEdge, mode],
    );

    if (itemKey === undefined || itemIndex === undefined) return null;

    const content = (
      <View key={itemKey} onLayout={handleLayout}>
        {renderItem({
          item: itemData,
          index: itemIndex,
          type: "",
          extraData,
          stickyOffset: mode === "offset" ? offset : undefined,
          stickyPinned: mode === "offset" ? pinnedByOverlay : undefined,
        })}
        {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
      </View>
    );

    return (
      <Animated.View style={[style, stickyStyle]}>{content}</Animated.View>
    );
  },
);

ListItemContainer.displayName = "ListItemContainer";

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  // Прилипший элемент идёт поверх соседей, мимо которых он проезжает.
  sticky: { zIndex: 1 },
});
