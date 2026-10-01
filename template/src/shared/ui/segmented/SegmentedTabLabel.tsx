import React, { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { Text } from "../text";
import { segmentOpacityRange } from "./segment-indicator";

export interface ISegmentedTabLabelProps {
  label: string;
  index: number;
  count: number;
  /** Позиция пейджера material-top-tabs (нативный драйвер) */
  position: Animated.AnimatedInterpolation<number>;
}

/**
 * Подпись вкладки на RN Animated: цвет не анимируется нативным драйвером,
 * поэтому два слоя (неактивный и активный цвет) с перекрёстной opacity по
 * `position` — как TabBarItem в react-native-tab-view.
 */
export const SegmentedTabLabel = ({
  label,
  index,
  count,
  position,
}: ISegmentedTabLabelProps) => {
  const { activeOpacity, inactiveOpacity } = useMemo(
    () => ({
      activeOpacity: position.interpolate({
        ...segmentOpacityRange(count, index, true),
        extrapolate: "clamp",
      }),
      inactiveOpacity: position.interpolate({
        ...segmentOpacityRange(count, index, false),
        extrapolate: "clamp",
      }),
    }),
    [count, index, position],
  );

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: inactiveOpacity }}>
        <Text textStyle={"Title_S2"} numberOfLines={1} color={"textSecondary"}>
          {label}
        </Text>
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: activeOpacity }]}
        accessibilityElementsHidden
        importantForAccessibility={"no-hide-descendants"}
      >
        <Text textStyle={"Title_S2"} numberOfLines={1} color={"textPrimary"}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
  },
});
