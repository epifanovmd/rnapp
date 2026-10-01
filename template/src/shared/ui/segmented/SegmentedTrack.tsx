import { useTheme } from "@shared/lib/theme";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import {
  AccessibilityRole,
  LayoutChangeEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import {
  centerScrollX,
  ISegmentLayout,
  mergeSegmentLayout,
  SEGMENT_TRACK_PADDING,
} from "./segment-indicator";
import { SegmentedOption } from "./segmented.types";
import { SegmentedItem } from "./SegmentedItem";

export interface ISegmentedTrackProps<V extends string> {
  options: SegmentedOption<V>[];
  selectedIndex: number;
  disabled?: boolean;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  itemRole: AccessibilityRole;
  /** Подложка выбранного сегмента: позиционируется по замерам сегментов. */
  indicator: ReactNode;
  /** Подпись-строка; не строковый label рисуется как есть. */
  renderLabel: (label: string, index: number) => ReactNode;
  onLayoutsChange: (layouts: ISegmentLayout[]) => void;
  onSelect: (index: number) => void;
}

/**
 * Дорожка Segmented без анимации: сегменты, замеры, прокрутка и
 * автоцентрирование активного. Индикатор и подписи — у владельца
 * (Reanimated в Segmented, RN Animated в SegmentedTabBar).
 */
export const SegmentedTrack = <V extends string,>({
  options,
  selectedIndex,
  disabled,
  scrollable,
  style,
  itemRole,
  indicator,
  renderLabel,
  onLayoutsChange,
  onSelect,
}: ISegmentedTrackProps<V>) => {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const containerWidthRef = useRef(0);
  const layoutsRef = useRef<ISegmentLayout[]>([]);
  const selectedIndexRef = useRef(selectedIndex);

  const scrollToIndex = useCallback((index: number) => {
    const layout = layoutsRef.current[index];

    if (layout?.width && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: centerScrollX(layout, containerWidthRef.current),
        animated: true,
      });
    }
  }, []);

  const handleItemLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      const next = mergeSegmentLayout(layoutsRef.current, options.length, index, {
        x,
        width,
      });

      layoutsRef.current = next;
      onLayoutsChange(next);

      if (scrollable && index === selectedIndexRef.current) {
        scrollToIndex(index);
      }
    },
    [onLayoutsChange, options.length, scrollToIndex, scrollable],
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
      if (scrollable) {
        scrollToIndex(index);
      }
      onSelect(index);
    },
    [onSelect, scrollToIndex, scrollable],
  );

  const items = options.map((option, index) => (
    <SegmentedItem
      key={option.value}
      index={index}
      icon={option.icon}
      active={index === selectedIndex}
      disabled={disabled || option.disabled}
      fill={!scrollable}
      accessibilityRole={itemRole}
      onPress={handlePress}
      onLayout={handleItemLayout}
    >
      {typeof option.label === "string"
        ? renderLabel(option.label, index)
        : option.label}
    </SegmentedItem>
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
    padding: SEGMENT_TRACK_PADDING,
    borderRadius: 12,
    gap: 2,
  },
});
