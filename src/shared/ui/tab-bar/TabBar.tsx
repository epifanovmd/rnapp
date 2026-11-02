import { useTheme } from "@shared/lib/theme";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import haptic from "react-native-haptic-feedback";
import Animated, {
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import type { ITabBarProps } from "./tab-bar.types";
import { resolveTabBarColor, withAlpha } from "./tab-bar-colors";
import { totalWeight, wormDelays } from "./tab-bar-geometry";
import { hugItemWidth } from "./tab-item-style";
import { TabBarIndicator } from "./TabBarIndicator";
import { TabBarItem } from "./TabBarItem";
import { TabBarSurface } from "./TabBarSurface";

/** Радиус плавающей панели, px. */
const FLOATING_RADIUS = 24;
/** Внутренний отступ панели, px. */
const PADDING = 6;
/** Прозрачность подложки-пилюли от цвета активной вкладки. */
const PILL_ALPHA = 0.16;

/**
 * Нижняя панель вкладок. Не знает про навигатор: вкладки, активный индекс,
 * нажатия. Вид настраивается — плавающая или прикреплённая, подписи у всех /
 * только у активной (вкладка расширяется) / без них, подложка-«червяк»,
 * точка или линия, размытие или сплошной фон, цвета, пружинка, вибрация,
 * бейджи. Переключение и раскладка — на UI-потоке.
 */
export const TabBar: FC<ITabBarProps> = ({
  items,
  activeIndex,
  onPress,
  onLongPress,
  bottomInset = 0,
  style,
  onLayout,
  variant = "floating",
  labels = "always",
  labelPosition,
  indicator = "pill",
  indicatorAnimation = "worm",
  surface = "blur",
  fit,
  activeColor,
  inactiveColor,
  indicatorColor,
  iconAnimation = "bounce",
  haptics = true,
  activeWeight,
  itemWidth: itemWidthProp,
  iconSize = 22,
  duration = 250,
}) => {
  const { colors } = useTheme();
  const floating = variant === "floating";
  const resolvedLabelPosition =
    labelPosition ?? (labels === "active" ? "beside" : "below");
  const itemWidth = hugItemWidth(labels, itemWidthProp);
  const weight = activeWeight ?? (labels === "active" ? 2.4 : 1);
  const resolvedFit = fit ?? (floating && labels === "never" ? "hug" : "fill");
  const active = resolveTabBarColor(activeColor, colors, "primary");
  const inactive = resolveTabBarColor(inactiveColor, colors, "textSecondary");
  const indicatorFill = indicatorColor
    ? resolveTabBarColor(indicatorColor, colors, "primary")
    : indicator === "pill"
      ? withAlpha(active, PILL_ALPHA)
      : active;

  const position = useSharedValue(activeIndex);
  const start = useSharedValue(activeIndex);
  const end = useSharedValue(activeIndex);
  const previous = useRef(activeIndex);
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    const from = previous.current;

    previous.current = activeIndex;
    if (from === activeIndex) return;

    const timing = { duration };

    position.value = withTiming(activeIndex, timing);

    if (indicatorAnimation === "worm") {
      const delays = wormDelays(from, activeIndex, duration * 0.5);

      start.value = withDelay(delays.start, withTiming(activeIndex, timing));
      end.value = withDelay(delays.end, withTiming(activeIndex, timing));
    } else {
      start.value = withTiming(activeIndex, timing);
      end.value = withTiming(activeIndex, timing);
    }
  }, [activeIndex, duration, indicatorAnimation, position, start, end]);

  const handlePress = useCallback(
    (key: string, index: number) => {
      if (haptics && index !== activeIndex) haptic.trigger("selection");
      onPress(key, index);
    },
    [haptics, activeIndex, onPress],
  );

  const onRowLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;

    setRowWidth(previousWidth =>
      previousWidth === next ? previousWidth : next,
    );
  }, []);

  // Анимированный стиль вкладки после перерисовки из React остаётся со старыми
  // значениями — при смене раскладки вкладки монтируются заново.
  const layoutKey = `${resolvedFit}:${labels}:${resolvedLabelPosition}:${weight}:${itemWidth}`;
  const radius = floating ? FLOATING_RADIUS : 0;
  const hugWidth = itemWidth * totalWeight(items.length, weight);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        floating ? styles.floating : styles.docked,
        floating && (resolvedFit === "hug" ? styles.hug : styles.fill),
        floating && { bottom: bottomInset },
        style,
      ]}
    >
      <View
        style={[
          styles.clip,
          {
            borderRadius: radius,
            paddingBottom: floating ? PADDING : PADDING + bottomInset,
            borderColor: withAlpha(colors.border, 0.5),
          },
          floating ? styles.border : styles.borderTop,
        ]}
      >
        <TabBarSurface surface={surface} />
        <View
          style={[styles.row, resolvedFit === "hug" && { width: hugWidth }]}
          onLayout={onRowLayout}
        >
          {indicator !== "none" && rowWidth > 0 && (
            <TabBarIndicator
              type={indicator}
              position={position}
              start={start}
              end={end}
              count={items.length}
              activeWeight={weight}
              width={rowWidth}
              color={indicatorFill}
              lineOnTop={!floating}
              radius={radius - PADDING}
            />
          )}
          {items.map((item, index) => (
            <TabBarItem
              key={`${item.key}:${layoutKey}`}
              item={item}
              index={index}
              focused={index === activeIndex}
              position={position}
              activeWeight={weight}
              fit={resolvedFit}
              itemWidth={itemWidth}
              labels={labels}
              labelPosition={resolvedLabelPosition}
              iconSize={iconSize}
              color={index === activeIndex ? active : inactive}
              bounce={iconAnimation === "bounce"}
              onPress={handlePress}
              onLongPress={onLongPress}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
    borderRadius: FLOATING_RADIUS,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fill: {
    left: 16,
    right: 16,
  },
  // По ширине вкладок, по центру экрана.
  hug: {
    alignSelf: "center",
  },
  docked: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  clip: {
    overflow: "hidden",
    paddingTop: PADDING,
    paddingHorizontal: PADDING,
  },
  border: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  borderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
});
