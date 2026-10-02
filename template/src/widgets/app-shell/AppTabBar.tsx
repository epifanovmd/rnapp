import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { ITabBarAppearance, ITabBarItem, TabBar } from "@shared/ui";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { LayoutChangeEvent } from "react-native";

import { useTabBar } from "./tab-bar";
import { TTabBarHideMode, useTabBarStyle } from "./use-tab-bar-style";

export interface IAppTabBarProps extends BottomTabBarProps, ITabBarAppearance {
  /** Как панель прячется при скролле. По умолчанию `"slide"`. */
  hideMode?: TTabBarHideMode;
}

/**
 * Таб-бар навигатора на `TabBar` кита: вкладки из опций экранов (`title`,
 * `tabBarLabel`, `tabBarIcon`, `tabBarBadge`), события `tabPress` (повторный
 * тап — `useScrollToTop`, отмена перехода) и `tabLongPress`, скрытие при
 * скролле и высота для отступов контента. Вид — пропсами `ITabBarAppearance`.
 */
export const AppTabBar = memo<IAppTabBarProps>(
  ({
    state: { routes, index },
    navigation,
    descriptors,
    insets: { bottom },
    hideMode,
    ...appearance
  }) => {
    const tabBar = useTabBar();
    const floating = (appearance.variant ?? "floating") === "floating";

    // переключение таба возвращает панель, не дожидаясь скролла
    useEffect(() => {
      tabBar.show();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    const items = useMemo<ITabBarItem[]>(
      () =>
        routes.map(route => {
          const options = descriptors[route.key]?.options ?? {};
          const title =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title;

          return {
            key: route.key,
            title,
            renderIcon: state => options.tabBarIcon?.(state) ?? null,
            badge: options.tabBarBadge,
            accessibilityLabel: options.tabBarAccessibilityLabel ?? title,
          };
        }),
      [routes, descriptors],
    );

    const onPress = useCallback(
      (_key: string, tabIndex: number) => {
        const route = routes[tabIndex];
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });

        if (tabIndex !== index && !event.defaultPrevented) {
          navigation.navigate(route.name, route.params);
        }
      },
      [routes, index, navigation],
    );

    const onLongPress = useCallback(
      (key: string) => navigation.emit({ type: "tabLongPress", target: key }),
      [navigation],
    );

    // Плавающая висит над safe area — её отступ контенту добавляется к высоте.
    const onLayout = useCallback(
      ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
        tabBar.setHeight(layout.height + (floating ? bottom : 0)),
      [tabBar, floating, bottom],
    );

    const hideStyle = useTabBarStyle(hideMode);

    return (
      <TabBar
        {...appearance}
        items={items}
        activeIndex={index}
        onPress={onPress}
        onLongPress={onLongPress}
        bottomInset={bottom}
        style={hideStyle}
        onLayout={onLayout}
      />
    );
  },
);
