import { useConstant, useLatestRef } from "@shared/lib/hooks";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewToken,
} from "react-native";

import type {
  ICalendarListOwnProps,
  TCalendarMonthKey,
} from "../calendar.types";
import { useCalendarActions, useCalendarConfig } from "../context";
import {
  buildMonthKeys,
  getMonthGrid,
  isProgrammaticScrollSettled,
  isScrollAtOffset,
  monthIndexOf,
  monthKeyToDayjs,
  resolveScrollEdges,
  weeksBlockHeight,
} from "../model";
import { CalendarHeaderConnected } from "./CalendarHeaderConnected";
import { MONTH_TITLE_HEIGHT } from "./CalendarMonth";
import { CalendarMonthConnected } from "./CalendarMonthConnected";
import { CalendarWeekDaysConnected } from "./CalendarWeekDaysConnected";

export type TCalendarListViewProps = Pick<
  ICalendarListOwnProps,
  | "showMonthTitles"
  | "monthTitleHeight"
  | "monthGap"
  | "getMonthHeight"
  | "onVisibleMonthChange"
  | "contentContainerStyle"
  | "showsVerticalScrollIndicator"
  | "scrollEnabled"
  | "visibleMonthThreshold"
  | "style"
>;

const keyExtractor = (key: TCalendarMonthKey) => key;
/** Края контента нужны только к концу скролла — частые события ни к чему. */
const SCROLL_EVENT_THROTTLE = 50;

/** Цель программного скролла: месяц и его расчётный offset. */
interface IProgrammaticScroll {
  key: TCalendarMonthKey;
  offset: number;
}

/**
 * Тело списка месяцев. Работает внутри `CalendarProvider`.
 * Состояние месяца здесь не читается: список сам сообщает провайдеру,
 * что видно, а переходы получает через навигатор.
 */
export const CalendarListView = ({
  showMonthTitles = true,
  monthTitleHeight = MONTH_TITLE_HEIGHT,
  monthGap = 8,
  getMonthHeight,
  onVisibleMonthChange,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEnabled,
  visibleMonthThreshold = 50,
  style,
}: TCalendarListViewProps) => {
  const config = useCalendarConfig();
  const { showHeader, showWeekDays, styles, locale } = config;
  const { firstDayOfWeek, fixedWeeks, dayHeight, weekGap } = config;
  const { registerNavigator, syncMonth, syncScrollEdges } =
    useCalendarActions();

  const listRef = useRef<FlatList<TCalendarMonthKey>>(null);
  // Диапазон месяцев провайдер считает вокруг стартового один раз — иначе список бы «плыл» при скролле.
  const anchor = config.initialMonthKey;
  const bounds = useMemo(
    () => config.monthBounds ?? { from: anchor, to: anchor },
    [config.monthBounds, anchor],
  );
  const monthKeys = useMemo(
    () => buildMonthKeys(bounds.from, bounds.to),
    [bounds],
  );

  /** Высоты и смещения всех месяцев для `getItemLayout`. Сетки из кэша, так что это дёшево. */
  const layout = useMemo(() => {
    const heights: number[] = [];
    const offsets: number[] = [];
    let offset = 0;

    for (const key of monthKeys) {
      const grid = getMonthGrid(key, { firstDayOfWeek, fixedWeeks });
      const height =
        (getMonthHeight?.(grid) ??
          (showMonthTitles ? monthTitleHeight : 0) +
            weeksBlockHeight(grid.weeks.length, dayHeight, weekGap)) + monthGap;

      heights.push(height);
      offsets.push(offset);
      offset += height;
    }

    return { heights, offsets };
  }, [
    monthKeys,
    firstDayOfWeek,
    fixedWeeks,
    dayHeight,
    weekGap,
    showMonthTitles,
    monthTitleHeight,
    monthGap,
    getMonthHeight,
  ]);

  const getItemLayout = useCallback(
    (_: ArrayLike<TCalendarMonthKey> | null | undefined, index: number) => ({
      length: layout.heights[index] ?? 0,
      offset: layout.offsets[index] ?? 0,
      index,
    }),
    [layout],
  );

  const initialIndex = monthIndexOf(bounds.from, bounds.to, anchor);
  const visibleRef = useRef(anchor);
  const onVisibleMonthChangeRef = useLatestRef(onVisibleMonthChange);
  const localeRef = useLatestRef(locale);
  const syncMonthRef = useLatestRef(syncMonth);
  const syncScrollEdgesRef = useLatestRef(syncScrollEdges);

  /**
   * Пока идёт программный анимированный скролл к `programmaticRef`,
   * промежуточные месяцы не синхронизируются — иначе шапка и `onMonthChange`
   * пробегали бы по всем месяцам между стартом и целью. Финиш — когда
   * viewability показала цель или список встал на её offset. Конец анимации
   * сам по себе финишем не считается: при двух быстрых переходах первый
   * приходит с прерванного скролла посреди пути.
   */
  const programmaticRef = useRef<IProgrammaticScroll | null>(null);
  const pendingVisibleRef = useRef<TCalendarMonthKey | null>(null);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const offsetRef = useRef(layout.offsets[initialIndex] ?? 0);

  const maxOffset = useCallback(
    () =>
      contentHeightRef.current && viewportHeightRef.current
        ? contentHeightRef.current - viewportHeightRef.current
        : null,
    [],
  );

  /** Края контента — по реальному offset: у конца списка последний месяц редко становится «текущим», а кнопке гаснуть надо. */
  const updateEdges = useCallback(() => {
    syncScrollEdgesRef.current(
      resolveScrollEdges(offsetRef.current, maxOffset()),
    );
  }, [maxOffset, syncScrollEdgesRef]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetRef.current = event.nativeEvent.contentOffset.y;
      updateEdges();
    },
    [updateEdges],
  );

  const applyVisible = useCallback(
    (key: TCalendarMonthKey) => {
      if (key === visibleRef.current) return;
      visibleRef.current = key;
      syncMonthRef.current(key);
      onVisibleMonthChangeRef.current?.(
        monthKeyToDayjs(key, localeRef.current),
        key,
      );
    },
    [localeRef, onVisibleMonthChangeRef, syncMonthRef],
  );

  const finishProgrammaticScroll = useCallback(
    (key: TCalendarMonthKey) => {
      programmaticRef.current = null;
      pendingVisibleRef.current = null;
      applyVisible(key);
    },
    [applyVisible],
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const target = programmaticRef.current;

      if (!target) return;

      if (
        isScrollAtOffset(
          event.nativeEvent.contentOffset.y,
          target.offset,
          maxOffset(),
        )
      ) {
        finishProgrammaticScroll(target.key);
      }
    },
    [finishProgrammaticScroll, maxOffset],
  );

  /** Пользователь взялся за список — программный скролл больше не наш. */
  const onScrollBeginDrag = useCallback(() => {
    const pending = pendingVisibleRef.current;

    programmaticRef.current = null;
    pendingVisibleRef.current = null;
    if (pending) applyVisible(pending);
  }, [applyVisible]);

  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      contentHeightRef.current = height;
      updateEdges();
    },
    [updateEdges],
  );

  const onListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeightRef.current = event.nativeEvent.layout.height;
      updateEdges();
    },
    [updateEdges],
  );

  useEffect(() => {
    registerNavigator({
      goToMonth: (key, animated) => {
        // Список уже стоит на этом месяце (например, родитель записал в `month` то, что мы сами сообщили).
        if (key === visibleRef.current) return;

        const index = monthIndexOf(bounds.from, bounds.to, key);

        if (index < 0) return;
        programmaticRef.current = animated
          ? { key, offset: layout.offsets[index] ?? 0 }
          : null;
        listRef.current?.scrollToIndex({ index, animated });
      },
    });

    return () => registerNavigator(null);
  }, [bounds, layout, registerNavigator]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<TCalendarMonthKey>[] }) => {
      const key = viewableItems[0]?.item;

      if (!key) return;

      const target = programmaticRef.current;

      if (!target) {
        applyVisible(key);
      } else if (isProgrammaticScrollSettled(target.key, key)) {
        finishProgrammaticScroll(target.key);
      } else {
        pendingVisibleRef.current = key;
      }
    },
    [applyVisible, finishProgrammaticScroll],
  );

  const viewabilityConfig = useConstant(() => ({
    itemVisiblePercentThreshold: visibleMonthThreshold,
  }));

  const itemStyle = useMemo(() => ({ paddingBottom: monthGap }), [monthGap]);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TCalendarMonthKey>) => (
      <View style={itemStyle}>
        <CalendarMonthConnected monthKey={item} withTitle={showMonthTitles} />
      </View>
    ),
    [itemStyle, showMonthTitles],
  );

  return (
    <View style={[SS.container, styles.container, style]}>
      {showHeader && <CalendarHeaderConnected />}
      {showWeekDays && <CalendarWeekDaysConnected />}
      <FlatList
        ref={listRef}
        data={monthKeys}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={onScroll}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        onContentSizeChange={onContentSizeChange}
        onLayout={onListLayout}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEnabled={scrollEnabled}
        windowSize={5}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        nestedScrollEnabled
      />
    </View>
  );
};

const SS = StyleSheet.create({
  container: { flex: 1 },
});
