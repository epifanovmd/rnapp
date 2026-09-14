import { useConstant, useLatestRef } from "@shared/lib/hooks";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  View,
  ViewToken,
} from "react-native";

import type {
  ICalendarListOwnProps,
  TCalendarMonthKey,
} from "../calendar.types";
import {
  useCalendarActions,
  useCalendarConfig,
  useCalendarState,
} from "../context";
import {
  buildMonthKeys,
  dateKeyToMonthKey,
  getMonthGrid,
  monthIndexOf,
  monthKeyToDayjs,
  resolveMonthBounds,
  weeksBlockHeight,
} from "../model";
import { CalendarHeaderConnected } from "./CalendarHeaderConnected";
import { MONTH_TITLE_HEIGHT } from "./CalendarMonth";
import { CalendarMonthConnected } from "./CalendarMonthConnected";
import { CalendarWeekDaysConnected } from "./CalendarWeekDaysConnected";

export type TCalendarListViewProps = Pick<
  ICalendarListOwnProps,
  | "pastMonths"
  | "futureMonths"
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

/** Тело списка месяцев. Работает внутри `CalendarProvider`. */
export const CalendarListView = ({
  pastMonths = 12,
  futureMonths = 12,
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
  const { showHeader, showWeekDays, styles, minKey, maxKey, locale } = config;
  const { firstDayOfWeek, fixedWeeks, dayHeight, weekGap } = config;
  const { monthKey } = useCalendarState();
  const { registerNavigator, syncMonth } = useCalendarActions();

  const listRef = useRef<FlatList<TCalendarMonthKey>>(null);
  // Диапазон месяцев строится вокруг стартового и дальше не меняется — иначе список бы «плыл» при скролле.
  const anchor = useConstant(() => monthKey);

  const bounds = useMemo(
    () =>
      resolveMonthBounds({
        initialMonth: anchor,
        minMonth: minKey ? dateKeyToMonthKey(minKey) : null,
        maxMonth: maxKey ? dateKeyToMonthKey(maxKey) : null,
        pastMonths,
        futureMonths,
      }),
    [anchor, minKey, maxKey, pastMonths, futureMonths],
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

  useEffect(() => {
    registerNavigator({
      goToMonth: (key, animated) => {
        const index = monthIndexOf(bounds.from, bounds.to, key);

        if (index >= 0) listRef.current?.scrollToIndex({ index, animated });
      },
    });

    return () => registerNavigator(null);
  }, [bounds, registerNavigator]);

  const visibleRef = useRef(anchor);
  const onVisibleMonthChangeRef = useLatestRef(onVisibleMonthChange);
  const localeRef = useLatestRef(locale);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<TCalendarMonthKey>[] }) => {
      const key = viewableItems[0]?.item;

      if (!key || key === visibleRef.current) return;
      visibleRef.current = key;
      syncMonth(key);
      onVisibleMonthChangeRef.current?.(
        monthKeyToDayjs(key, localeRef.current),
        key,
      );
    },
  ).current;

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
        initialScrollIndex={monthIndexOf(bounds.from, bounds.to, anchor)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
