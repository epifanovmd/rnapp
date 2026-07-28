import { useCallback, useEffect, useRef } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from "react-native";

import { ITabItem, Tab } from "./Tab";

export interface ITabsProps<Value> extends ScrollViewProps {
  activeIndex?: number;
  items: ITabItem<Value>[];
  onPress?: (value: Value) => void;
}

export const Tabs = <Value extends any = unknown>({
  activeIndex,
  items,
  onPress,
  style,
  ...rest
}: ITabsProps<Value>) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const tabPositionsRef = useRef<{ x: number; width: number }[]>([]);
  const containerWidthRef = useRef<number>(0);

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { layout } = event.nativeEvent;

      tabPositionsRef.current[index] = {
        x: layout.x,
        width: layout.width,
      };
    },
    [],
  );

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    containerWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const tabPosition = tabPositionsRef.current[index];

    if (tabPosition && scrollViewRef.current) {
      const { x, width } = tabPosition;
      const tabCenter = x + width / 2;
      const scrollPosition = tabCenter - containerWidthRef.current / 2;

      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: true,
      });
    }
  }, []);

  useEffect(() => {
    if (activeIndex !== undefined && activeIndex >= 0) {
      requestAnimationFrame(() => {
        scrollToIndex(activeIndex);
      });
    }
  }, [activeIndex, scrollToIndex]);

  const handlePress = useCallback(
    (index: number, value: Value) => {
      scrollToIndex(index);
      onPress?.(value);
    },
    [onPress, scrollToIndex],
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ padding: 8 }}
      onLayout={handleContainerLayout}
      style={[style, SS.scrollView]}
      {...rest}
    >
      {items.map((item, index) => (
        <Tab
          key={index}
          isActive={index === activeIndex}
          item={item}
          onPress={() => handlePress(index, item.value)}
          onLayout={event => handleTabLayout(index, event)}
        />
      ))}
    </ScrollView>
  );
};

const SS = StyleSheet.create({
  scrollView: {
    alignSelf: "flex-start",
    flexGrow: 0,
    flexShrink: 0,
  },
});
