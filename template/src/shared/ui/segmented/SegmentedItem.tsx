import React, { PropsWithChildren, ReactNode } from "react";
import {
  AccessibilityRole,
  LayoutChangeEvent,
  StyleSheet,
} from "react-native";

import { Touchable } from "../touchable";
import { SEGMENT_RADIUS } from "./segment-indicator";

export interface ISegmentedItemProps {
  index: number;
  icon?: ReactNode;
  active: boolean;
  disabled?: boolean;
  fill?: boolean;
  accessibilityRole: AccessibilityRole;
  onPress: (index: number) => void;
  onLayout: (index: number, event: LayoutChangeEvent) => void;
}

/** Сегмент переключателя: нажатие и замер; подпись рисует владелец. */
export const SegmentedItem = ({
  index,
  icon,
  active,
  disabled,
  fill,
  accessibilityRole,
  onPress,
  onLayout,
  children,
}: PropsWithChildren<ISegmentedItemProps>) => (
  <Touchable
    ctx={index}
    disabled={disabled}
    onPress={onPress}
    onLayout={event => onLayout(index, event)}
    style={[styles.item, fill && styles.fill, disabled && styles.disabled]}
    accessibilityRole={accessibilityRole}
    accessibilityState={{ selected: active, disabled }}
  >
    {icon}
    {children}
  </Touchable>
);

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: SEGMENT_RADIUS,
  },
  fill: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
