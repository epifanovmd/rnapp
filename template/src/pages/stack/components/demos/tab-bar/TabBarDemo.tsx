import { useTheme } from "@shared/lib/theme";
import { Icon, ITabBarItem, ScreenScroll, TabBar, Text } from "@shared/ui";
import React, { FC, memo, useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_TAB_BAR_DEMO,
  TAB_BAR_DEMO_BADGES,
  TAB_BAR_DEMO_ITEMS,
} from "./tab-bar-demo-options";
import { TabBarDemoSettings } from "./TabBarDemoSettings";

/** Место под панель внизу списка настроек, px. */
const BAR_SPACE = 120;

/** Демо таб-бара кита: живая панель внизу и все настройки вида. */
export const TabBarDemo: FC = memo(() => {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const [options, setOptions] = useState(DEFAULT_TAB_BAR_DEMO);
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo<ITabBarItem[]>(
    () =>
      TAB_BAR_DEMO_ITEMS.map(item => ({
        key: item.key,
        title: item.title,
        renderIcon: ({ color, size }) => (
          <Icon name={item.icon} color={color} size={size} />
        ),
        badge: options.badges ? TAB_BAR_DEMO_BADGES[item.key] : undefined,
      })),
    [options.badges],
  );

  const onPress = useCallback(
    (_key: string, index: number) => setActiveIndex(index),
    [],
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScreenScroll bottomInset={BAR_SPACE}>
        <Text textStyle={"Title_L"}>
          {TAB_BAR_DEMO_ITEMS[activeIndex].title}
        </Text>
        <TabBarDemoSettings options={options} onChange={setOptions} />
      </ScreenScroll>
      <TabBar
        items={items}
        activeIndex={activeIndex}
        onPress={onPress}
        bottomInset={bottom}
        variant={options.variant}
        labels={options.labels}
        indicator={options.indicator}
        indicatorAnimation={options.indicatorAnimation}
        surface={options.surface}
        fit={options.fit === "auto" ? undefined : options.fit}
        iconAnimation={options.bounce ? "bounce" : "none"}
        haptics={options.haptics}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
