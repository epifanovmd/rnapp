import React, { FC, memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Text } from "../text";
import { Touchable } from "../touchable";
import type {
  ITabBarItem,
  TTabBarFit,
  TTabBarLabelPosition,
  TTabBarLabels,
} from "./tab-bar.types";
import { tabWeight } from "./tab-bar-geometry";
import { TabBarBadge } from "./TabBarBadge";

/** Пружинка иконки при выборе: сжатие, один отскок, возврат — без колебаний. */
const PRESS_SCALE = 0.82;
const OVERSHOOT_SCALE = 1.1;
const PRESS = { duration: 90, easing: Easing.out(Easing.quad) };
const OVERSHOOT = { duration: 150, easing: Easing.out(Easing.quad) };
const SETTLE = { duration: 130, easing: Easing.inOut(Easing.quad) };

/** Наибольшая ширина подписи рядом с иконкой, px. */
const BESIDE_LABEL_MAX = 160;

interface ITabBarItemProps {
  item: ITabBarItem;
  index: number;
  focused: boolean;
  position: SharedValue<number>;
  activeWeight: number;
  fit: TTabBarFit;
  itemWidth: number;
  labels: TTabBarLabels;
  labelPosition: TTabBarLabelPosition;
  iconSize: number;
  color: string;
  bounce: boolean;
  onPress: (key: string, index: number) => void;
  onLongPress?: (key: string, index: number) => void;
}

/** Вкладка: ширина по весу (UI-поток), иконка с пружинкой, подпись, бейдж. */
export const TabBarItem: FC<ITabBarItemProps> = memo(
  ({
    item,
    index,
    focused,
    position,
    activeWeight,
    fit,
    itemWidth,
    labels,
    labelPosition,
    iconSize,
    color,
    bounce,
    onPress,
    onLongPress,
  }) => {
    const scale = useSharedValue(1);
    const mounted = useRef(false);

    useEffect(() => {
      if (mounted.current && focused && bounce) {
        scale.value = withSequence(
          withTiming(PRESS_SCALE, PRESS),
          withTiming(OVERSHOOT_SCALE, OVERSHOOT),
          withTiming(1, SETTLE),
        );
      }
      mounted.current = true;
    }, [focused, bounce, scale]);

    const sizeStyle = useAnimatedStyle(() => {
      const weight = tabWeight(position.value, index, activeWeight);

      return fit === "fill" ? { flex: weight } : { width: weight * itemWidth };
    }, [position, index, activeWeight, fit, itemWidth]);

    const iconStyle = useAnimatedStyle(
      () => ({ transform: [{ scale: scale.value }] }),
      [scale],
    );

    // «Только у активной»: подпись раскрывается вместе с шириной вкладки.
    const labelStyle = useAnimatedStyle(() => {
      if (labels !== "active") return {};

      const visible = Math.max(0, 1 - Math.abs(position.value - index));

      return labelPosition === "beside"
        ? {
            opacity: visible,
            maxWidth: BESIDE_LABEL_MAX * visible,
            marginLeft: 6 * visible,
          }
        : { opacity: visible };
    }, [labels, labelPosition, position, index]);

    const showLabel = labels !== "never" && !!item.title;
    const beside = labelPosition === "beside";

    return (
      <Animated.View style={[styles.slot, sizeStyle]}>
        <Touchable
          style={[styles.touch, beside ? styles.row : styles.column]}
          onPress={() => onPress(item.key, index)}
          onLongPress={onLongPress ? () => onLongPress(item.key, index) : undefined}
          accessibilityRole={"tab"}
          accessibilityLabel={item.accessibilityLabel ?? item.title}
          accessibilityState={{ selected: focused }}
        >
          <Animated.View style={iconStyle}>
            <View>
              {item.renderIcon({ focused, color, size: iconSize })}
              {item.badge !== undefined && <TabBarBadge value={item.badge} />}
            </View>
          </Animated.View>
          {showLabel && (
            <Animated.View style={[styles.label, labelStyle]}>
              <Text
                textStyle={"Caption_M1"}
                color={color}
                numberOfLines={1}
                ellipsizeMode={"clip"}
              >
                {item.title}
              </Text>
            </Animated.View>
          )}
        </Touchable>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  slot: {
    alignSelf: "stretch",
  },
  touch: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 44,
  },
  row: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
    gap: 2,
  },
  label: {
    overflow: "hidden",
  },
});
