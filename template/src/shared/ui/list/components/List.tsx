import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import type { IListRuntimeProps } from "../core";
import { ListRuntime } from "../core";
import { useListSharedValues } from "../hooks";
import { ListContextProvider, ListStore } from "../model";
import type { IListProps, IListRef, IListRenderItemProps } from "../types";
import { ListAnchoredEndSpace } from "./ListAnchoredEndSpace";
import { ListContainers } from "./ListContainers";
import { ListScrollAdjust } from "./ListScrollAdjust";

const DEFAULT_DRAW_DISTANCE = 250;
const SCROLL_EVENT_THROTTLE = 16;
/** Шаг, с которым пересчёт диапазона уходит в JS, px. */
const JS_SCROLL_STEP = 4;
/** Пороги задаются в долях длины вьюпорта. */
const DEFAULT_EDGE_THRESHOLD = 0.5;
const DEFAULT_MAINTAIN_AT_END_THRESHOLD = 0.1;

/** Header/Footer/Empty принимаются и элементом, и типом компонента. */
const renderSlot = (
  slot: IListProps<unknown>["ListHeaderComponent"],
): React.ReactNode => {
  if (!slot) return null;
  if (React.isValidElement(slot)) return slot;

  const Component = slot as React.ComponentType<unknown>;

  return <Component />;
};

/**
 * Виртуализированный список.
 *
 * Диапазон отрисовки, позиции и привязка контейнеров считаются в `ListRuntime`
 * вне React: рендер вызывается только там, где контейнер сменил элемент или
 * позицию.
 */
const ListInner = <TItem,>(
  {
    data,
    renderItem,
    keyExtractor,
    getItemType,
    getFixedItemSize,
    estimatedItemSize,
    drawDistance = DEFAULT_DRAW_DISTANCE,
    extraData,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    style,
    contentContainerStyle,
    onLoad,
    onStartReached,
    onStartReachedThreshold = DEFAULT_EDGE_THRESHOLD,
    onEndReached,
    onEndReachedThreshold = DEFAULT_EDGE_THRESHOLD,
    maintainScrollAtEnd,
    maintainScrollAtEndThreshold = DEFAULT_MAINTAIN_AT_END_THRESHOLD,
    maintainVisibleContentPosition,
    alignItemsAtEnd = false,
    initialScroll,
    anchoredEndSpace,
    sticky,
    snapToIndices,
    sharedValues,
    viewabilityPairs,
    refScrollView,
    onLayout,
    onContentSizeChange,
    onScrollBeginDrag,
    onScrollEndDrag,
  }: IListProps<TItem>,
  ref: React.Ref<IListRef>,
) => {
  const [store] = useState(() => new ListStore());

  const runtimeProps = {
    data,
    keyExtractor,
    getItemType,
    getFixedItemSize,
    estimatedItemSize,
    drawDistance,
    startReachedThreshold: onStartReachedThreshold,
    endReachedThreshold: onEndReachedThreshold,
    maintainScrollAtEndThreshold,
    maintainScrollAtEnd: !!maintainScrollAtEnd,
    maintainScrollAtEndAnimated: maintainScrollAtEnd?.animated ?? false,
    maintainVisibleContentPositionData:
      maintainVisibleContentPosition?.data ?? false,
    maintainVisibleContentPositionSize:
      maintainVisibleContentPosition?.size ?? false,
    shouldRestorePosition: maintainVisibleContentPosition?.shouldRestorePosition
      ? (index: number) => {
          const item = data[index];

          return item === undefined
            ? false
            : (maintainVisibleContentPosition.shouldRestorePosition?.(
                item,
                index,
              ) ?? true);
        }
      : undefined,
    alignItemsAtEnd,
    initialScroll,
    anchoredEndSpace,
    sticky,
    viewabilityPairs:
      viewabilityPairs as IListRuntimeProps<TItem>["viewabilityPairs"],
    onLoad,
    onStartReached,
    onEndReached,
  };

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

  /** Смещение, при котором в JS уходил последний пересчёт диапазона. */
  const lastReportedScroll = useSharedValue(0);

  /**
   * Скролл обрабатывается одним worklet-обработчиком.
   *
   * Смещение попадает в shared value синхронно с нативным скроллом — от него
   * зависит прилипание, и отставание хотя бы на кадр видно как дрожание. В JS
   * уходит только пересчёт диапазона отрисовки, и то шагами: он определяет,
   * какие ячейки смонтированы, и точность в один пиксель ему не нужна.
   */
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: event => {
        scrollOffset.value = event.contentOffset.y;

        if (
          Math.abs(event.contentOffset.y - lastReportedScroll.value) <
          JS_SCROLL_STEP
        )
          return;

        lastReportedScroll.value = event.contentOffset.y;
        runOnJS(updateScroll)(event.contentOffset.y);
      },
      onBeginDrag: () => runOnJS(handleScrollBeginDrag)(),
      onEndDrag: () => runOnJS(handleScrollEndDrag)(),
      onMomentumEnd: () => runOnJS(handleMomentumScrollEnd)(),
    },
    [
      updateScroll,
      handleScrollBeginDrag,
      handleScrollEndDrag,
      handleMomentumScrollEnd,
    ],
  );

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

        {renderSlot(ListHeaderComponent)}

        {data.length === 0 ? (
          renderSlot(ListEmptyComponent)
        ) : (
          <ListContainers
            renderItem={renderItemUntyped}
            extraData={extraData}
            ItemSeparatorComponent={ItemSeparatorComponent}
          />
        )}

        <ListAnchoredEndSpace />

        <View>{renderSlot(ListFooterComponent)}</View>
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
