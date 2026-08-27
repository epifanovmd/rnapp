import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { LayoutChangeEvent, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";

import { createRuntimeProps, ListRuntime } from "../core";
import { useListScrollHandler, useListSharedValues } from "../hooks";
import { ListContextProvider, ListStore } from "../model";
import type { IListProps, IListRef, IListRenderItemProps } from "../types";
import { renderListSlot } from "./list-slots";
import { ListAnchoredEndSpace } from "./ListAnchoredEndSpace";
import { ListContainers } from "./ListContainers";
import { ListScrollAdjust } from "./ListScrollAdjust";

/** Как часто нативный слой шлёт события скролла, мс. */
const SCROLL_EVENT_THROTTLE = 16;

/**
 * Виртуализированный список.
 *
 * Диапазон отрисовки, позиции и привязка контейнеров считаются в `ListRuntime`
 * вне React: рендер вызывается только там, где контейнер сменил элемент или
 * позицию. Сам компонент — тонкая оболочка: он монтирует `ScrollView`, отдаёт
 * ядру размеры и события и раздаёт дереву контекст.
 */
const ListInner = <TItem,>(
  props: IListProps<TItem>,
  ref: React.Ref<IListRef>,
) => {
  const {
    data,
    renderItem,
    extraData,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    style,
    contentContainerStyle,
    maintainVisibleContentPosition,
    sticky,
    snapToIndices,
    sharedValues,
    refScrollView,
    onLayout,
    onContentSizeChange,
    onScrollBeginDrag,
    onScrollEndDrag,
  } = props;

  const [store] = useState(() => new ListStore());
  const runtimeProps = createRuntimeProps(props);
  const [runtime] = useState(() => new ListRuntime<TItem>(store, runtimeProps));

  // Пропы применяются после коммита, а не в теле рендера: пересчёт пишет
  // сигналы, а те обновляют состояние контейнеров — во время рендера React
  // такие обновления откладывает, и новые элементы остаются неотрисованными.
  useLayoutEffect(() => {
    runtime.setProps(runtimeProps);
  });

  const innerScrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollRef = refScrollView ?? innerScrollRef;
  const scrollOffset = useSharedValue(0);

  useEffect(() => {
    runtime.setAdapter({
      scrollToEnd: animated => scrollRef.current?.scrollToEnd({ animated }),
      scrollToOffset: (offset, animated) =>
        scrollRef.current?.scrollTo({ y: offset, animated }),
      getOffset: () => scrollOffset.value,
    });

    return () => {
      runtime.setAdapter(undefined);
      runtime.dispose();
    };
  }, [runtime, scrollRef, scrollOffset]);

  useImperativeHandle(
    ref,
    (): IListRef => ({
      scrollToIndex: params => runtime.scrollToIndex(params),
      scrollToOffset: ({ offset, animated }) =>
        runtime.scrollToOffset(offset, animated),
      scrollToEnd: params => runtime.scrollToEnd(params?.animated),
      getPositionAtIndex: index => runtime.getPositionAtIndex(index),
      getVisibleRange: () => runtime.getRange(),
      getScrollOffset: () => runtime.getScroll(),
    }),
    [runtime],
  );

  const contextValue = useMemo(
    () => ({ store, runtime, scrollOffset, sticky: sticky ?? [] }),
    [store, runtime, scrollOffset, sticky],
  );

  useListSharedValues(store, scrollOffset, sharedValues);

  // Компенсацию делает сам ScrollView: программный скролл посреди жеста гасит
  // и жест, и инерцию.
  const nativeMaintainVisibleContentPosition = useMemo(
    () =>
      maintainVisibleContentPosition?.data ||
      maintainVisibleContentPosition?.size
        ? { minIndexForVisible: 0 }
        : undefined,
    [maintainVisibleContentPosition],
  );

  const snapToOffsets = useMemo(
    () => snapToIndices?.map(index => runtime.getPositionAtIndex(index) ?? 0),
    [runtime, snapToIndices],
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      runtime.setContentSize(height);
      onContentSizeChange?.(width, height);
    },
    [runtime, onContentSizeChange],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      runtime.setScrollLength(event.nativeEvent.layout.height);
      onLayout?.(event);
    },
    [runtime, onLayout],
  );

  const updateScroll = useCallback(
    (offset: number) => runtime.setScroll(offset),
    [runtime],
  );

  const handleScrollBeginDrag = useCallback(() => {
    runtime.onGestureBegin();
    onScrollBeginDrag?.();
  }, [runtime, onScrollBeginDrag]);

  const handleScrollEndDrag = useCallback(() => {
    runtime.onGestureEnd();
    onScrollEndDrag?.();
  }, [runtime, onScrollEndDrag]);

  const handleMomentumScrollEnd = useCallback(
    () => runtime.onGestureEnd(),
    [runtime],
  );

  const scrollHandler = useListScrollHandler({
    scrollOffset,
    onScroll: updateScroll,
    onBeginDrag: handleScrollBeginDrag,
    onEndDrag: handleScrollEndDrag,
    onMomentumEnd: handleMomentumScrollEnd,
  });

  const renderItemUntyped = renderItem as (
    props: IListRenderItemProps<unknown>,
  ) => React.ReactNode;

  return (
    <ListContextProvider value={contextValue}>
      <Animated.ScrollView
        ref={scrollRef}
        style={style}
        contentContainerStyle={contentContainerStyle}
        onLayout={handleLayout}
        onScroll={scrollHandler}
        onContentSizeChange={handleContentSizeChange}
        maintainVisibleContentPosition={nativeMaintainVisibleContentPosition}
        snapToOffsets={snapToOffsets}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        bounces={false}
      >
        {/* Первым ребёнком: за ним следит нативное удержание позиции. */}
        <ListScrollAdjust />

        {renderListSlot(ListHeaderComponent)}

        {data.length === 0 ? (
          renderListSlot(ListEmptyComponent)
        ) : (
          <ListContainers
            renderItem={renderItemUntyped}
            extraData={extraData}
            ItemSeparatorComponent={ItemSeparatorComponent}
          />
        )}

        <ListAnchoredEndSpace />

        <View>{renderListSlot(ListFooterComponent)}</View>
      </Animated.ScrollView>
    </ListContextProvider>
  );
};

/**
 * Виртуализированный список.
 *
 * `forwardRef` теряет дженерик, поэтому тип восстанавливается приведением —
 * иначе элемент списка выводился бы как `unknown` на каждом использовании.
 */
export const List = forwardRef(ListInner) as <TItem>(
  props: IListProps<TItem> & { ref?: React.Ref<IListRef> },
) => React.ReactElement;
