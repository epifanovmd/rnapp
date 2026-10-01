import { useTheme } from "@shared/lib/theme";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { FlexProps, useFlexProps } from "../flex-view";
import { SegmentedItem } from "./SegmentedItem";

export interface SegmentedOption<V extends string = string> {
  label: ReactNode;
  value: V;
  icon?: ReactNode;
  disabled?: boolean;
  /** Описание варианта: SegmentedFormField показывает его под полем. */
  description?: ReactNode;
}

export interface ISegmentedProps<V extends string = string> extends FlexProps {
  options: SegmentedOption<V>[];
  value?: V;
  onValueChange?: (value: V, index: number) => void;
  disabled?: boolean;
  /** Сегменты по ширине контента с горизонтальной прокруткой и автоцентрированием активного. */
  scrollable?: boolean;
  /**
   * Внешний дробный индекс индикатора (например, позиция пейджера).
   * Если задан — индикатор и цвета следуют за ним вместо анимации к `value`.
   */
  progress?: SharedValue<number>;
  /** Длительность анимации индикатора при смене `value`, мс. */
  duration?: number;
}

interface ISegmentLayout {
  x: number;
  width: number;
}

const TRACK_PADDING = 3;

/** Сегментированный переключатель с анимированным индикатором выбранного варианта. */
export const Segmented = <V extends string = string>({
  options,
  value,
  onValueChange,
  disabled,
  scrollable,
  progress,
  duration = 200,
  ...rest
}: ISegmentedProps<V>) => {
  const { colors } = useTheme();
  const { style } = useFlexProps(rest);
  const selected = value ?? options[0]?.value;
  const selectedIndex = options.findIndex(option => option.value === selected);

  const scrollRef = useRef<ScrollView>(null);
  const containerWidthRef = useRef(0);
  const layoutsRef = useRef<ISegmentLayout[]>([]);
  const selectedIndexRef = useRef(selectedIndex);
  const layouts = useSharedValue<ISegmentLayout[]>([]);
  const animatedIndex = useSharedValue(selectedIndex);

  useEffect(() => {
    animatedIndex.value = withTiming(selectedIndex, { duration });
  }, [animatedIndex, duration, selectedIndex]);

  const indicatorProgress = useDerivedValue(() =>
    progress ? progress.value : animatedIndex.value,
  );

  const scrollToIndex = useCallback((index: number) => {
    const layout = layoutsRef.current[index];

    if (layout?.width && scrollRef.current) {
      const center = layout.x + layout.width / 2;

      scrollRef.current.scrollTo({
        x: Math.max(0, center - containerWidthRef.current / 2),
        animated: true,
      });
    }
  }, []);

  const handleItemLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      const next = Array.from(
        { length: options.length },
        (_, i) => layoutsRef.current[i] ?? { x: 0, width: 0 },
      );

      next[index] = { x, width };
      layoutsRef.current = next;
      layouts.value = next;

      if (scrollable && index === selectedIndexRef.current) {
        scrollToIndex(index);
      }
    },
    [layouts, options.length, scrollToIndex, scrollable],
  );

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;

    if (!scrollable || selectedIndex < 0) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => scrollToIndex(selectedIndex));

    return () => cancelAnimationFrame(frame);
  }, [scrollToIndex, scrollable, selectedIndex]);

  const handlePress = useCallback(
    (index: number) => {
      const option = options[index];

      if (option) {
        if (scrollable) {
          scrollToIndex(index);
        }
        onValueChange?.(option.value, index);
      }
    },
    [onValueChange, options, scrollToIndex, scrollable],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const list = layouts.value;
    const position = indicatorProgress.value;
    const last = list.length - 1;

    if (last < 0 || position < 0) {
      return { opacity: 0 };
    }

    const clamped = Math.min(position, last);
    const from = list[Math.floor(clamped)];
    const to = list[Math.ceil(clamped)];

    if (!from?.width || !to?.width) {
      return { opacity: 0 };
    }

    const t = clamped - Math.floor(clamped);

    return {
      opacity: 1,
      width: from.width + (to.width - from.width) * t,
      transform: [{ translateX: from.x + (to.x - from.x) * t }],
    };
  });

  const indicator = (
    <Animated.View
      pointerEvents={"none"}
      style={[
        styles.indicator,
        { backgroundColor: colors.surface },
        indicatorStyle,
      ]}
    />
  );

  const items = options.map((option, index) => (
    <SegmentedItem
      key={option.value}
      index={index}
      label={option.label}
      icon={option.icon}
      active={index === selectedIndex}
      disabled={disabled || option.disabled}
      fill={!scrollable}
      progress={indicatorProgress}
      onPress={handlePress}
      onLayout={handleItemLayout}
    />
  ));

  const track = [styles.track, { backgroundColor: colors.onSurface }];

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={event => {
          containerWidthRef.current = event.nativeEvent.layout.width;
          scrollToIndex(selectedIndexRef.current);
        }}
        style={[styles.scroll, style]}
        contentContainerStyle={track}
      >
        {indicator}
        {items}
      </ScrollView>
    );
  }

  return (
    <View style={[track, style]}>
      {indicator}
      {items}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  track: {
    flexDirection: "row",
    padding: TRACK_PADDING,
    borderRadius: 12,
    gap: 2,
  },
  indicator: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: 0,
    borderRadius: 9,
  },
});
