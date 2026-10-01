import { BlurView } from "@react-native-community/blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "@shared/lib/theme";
import { Text, Touchable } from "@shared/ui";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTabBar } from "./tab-bar";
import { resolveIndicatorInsets, resolveWormDelays } from "./tab-bar-indicator";
import { TTabBarHideMode, useTabBarStyle } from "./use-tab-bar-style";

/** Внутренний отступ панели — от него же отступы подложки, px. */
const BAR_PADDING = 8;
/** Задержка догоняющего края «червяка», мс. */
const WORM_DELAY = 150;
const WORM_DURATION = 150;

export interface ITabBarProps extends BottomTabBarProps {
  /** Как панель прячется при скролле (default "slide") */
  hideMode?: TTabBarHideMode;
  /**
   * Подписи под иконками (default true). Без них панель компактная: вкладки
   * фиксированной ширины, панель по центру по ширине содержимого.
   */
  showLabels?: boolean;
}

export const TabBar = memo<ITabBarProps>(
  ({
    state: { routes, index },
    insets: { bottom },
    navigation,
    descriptors,
    hideMode,
    showLabels = true,
  }) => {
    const [width, setWidth] = useState(0);
    const tabBar = useTabBar();
    const { isLight } = useTheme();
    const leftInset = useSharedValue(BAR_PADDING);
    const rightInset = useSharedValue(BAR_PADDING);
    // Прежний индекс — ref, а не state: направление «червяка» нужно в том же
    // эффекте, где стартует анимация (state отставал на рендер, и при смене
    // направления задержка не назначалась).
    const prevIndexRef = useRef(index);
    const prevWidthRef = useRef(0);

    // переключение таба возвращает панель, не дожидаясь скролла
    useEffect(() => {
      tabBar.show();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    useEffect(() => {
      if (!width) return;

      const tabWidth = width / routes.length;
      const target = resolveIndicatorInsets(
        index,
        routes.length,
        tabWidth,
        BAR_PADDING,
      );
      const from = prevIndexRef.current;
      const resized = prevWidthRef.current !== width;

      prevIndexRef.current = index;
      prevWidthRef.current = width;

      // Первый замер и смена ширины — без анимации.
      if (resized) {
        leftInset.value = target.left;
        rightInset.value = target.right;

        return;
      }

      const delays = resolveWormDelays(from, index, WORM_DELAY);
      const timing = { duration: WORM_DURATION };

      leftInset.value = withDelay(delays.left, withTiming(target.left, timing));
      rightInset.value = withDelay(
        delays.right,
        withTiming(target.right, timing),
      );
    }, [index, width, routes.length, leftInset, rightInset]);

    const activeIndicatorStyle = useAnimatedStyle(() => ({
      left: leftInset.value,
      right: rightInset.value,
    }));

    const handleTabPress = useCallback(
      (routeName: string) => {
        navigation.navigate(routeName);
      },
      [navigation],
    );

    const onLayout = useCallback(
      ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        tabBar.setHeight(layout.height + bottom);
        setWidth(layout.width - BAR_PADDING * 2);
      },
      [bottom, tabBar],
    );

    const hideStyle = useTabBarStyle(hideMode);

    return (
      <Animated.View
        style={[
          SS.container,
          !showLabels && SS.containerCompact,
          { bottom },
          hideStyle,
        ]}
        onLayout={onLayout}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={"dark"}
          blurAmount={1}
        />
        <Animated.View style={[SS.active, activeIndicatorStyle]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isLight ? "dark" : "light"}
            blurAmount={1}
          />
        </Animated.View>
        {routes.map((route, ind) => {
          const icon = descriptors[route.key]?.options.tabBarIcon?.({
            focused: ind === index,
            color: "white",
            size: showLabels ? 24 : 22,
          });
          const title = descriptors[route.key]?.options.title;

          return (
            <Touchable
              ctx={route.name}
              key={route.key}
              style={[SS.tabTouchable, !showLabels && SS.tabCompact]}
              onPress={handleTabPress}
              accessibilityRole={"tab"}
              accessibilityLabel={title}
              accessibilityState={{ selected: ind === index }}
            >
              {icon}
              {showLabels && !!title && (
                <Text
                  color={"white"}
                  textStyle={"Caption_M1"}
                  numberOfLines={1}
                  text={title}
                />
              )}
            </Touchable>
          );
        })}
      </Animated.View>
    );
  },
);

const SS = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: "hidden",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  // Без подписей: панель по ширине вкладок, по центру экрана.
  containerCompact: {
    left: undefined,
    right: undefined,
    alignSelf: "center",
    flex: 0,
  },
  tabTouchable: {
    flex: 1,
    flexBasis: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 36,
  },
  tabCompact: {
    flex: 0,
    flexBasis: "auto",
    width: 56,
    paddingVertical: 10,
  },
  active: {
    borderRadius: 12,
    position: "absolute",
    overflow: "hidden",
    left: 8,
    top: 8,
    bottom: 8,
  },
});
