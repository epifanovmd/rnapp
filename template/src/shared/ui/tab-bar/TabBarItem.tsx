import React, { FC, memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
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
          withTiming(0.82, { duration: 90 }),
          withSpring(1, { damping: 9, stiffness: 280 }),
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
