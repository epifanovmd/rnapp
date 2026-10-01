import { useTheme } from "@shared/lib/theme";
import React, { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { FlexProps, useFlexProps } from "../flex-view";
import { Text } from "../text";
import { Touchable } from "../touchable";

export interface SegmentedOption<V extends string = string> {
  label: ReactNode;
  value: V;
  icon?: ReactNode;
  disabled?: boolean;
  /** Описание варианта: SegmentedFormField показывает его под полем. */
  description?: ReactNode;
}

export interface ISegmentedProps<V extends string = string> extends FlexProps {
  options: SegmentedOption<V>[];
  value?: V;
  onValueChange?: (value: V) => void;
  disabled?: boolean;
  /** Сегменты по ширине контента с горизонтальной прокруткой. */
  scrollable?: boolean;
}

/** Сегментированный переключатель вариантов. */
export const Segmented = <V extends string = string>({
  options,
  value,
  onValueChange,
  disabled,
  scrollable,
  ...rest
}: ISegmentedProps<V>) => {
  const { colors } = useTheme();
  const { style } = useFlexProps(rest);
  const selected = value ?? options[0]?.value;

  const items = options.map(option => {
    const active = option.value === selected;
    const isDisabled = disabled || option.disabled;

    return (
      <Touchable
        key={option.value}
        disabled={isDisabled}
        onPress={() => onValueChange?.(option.value)}
        style={[
          styles.item,
          !scrollable && styles.itemFill,
          active && { backgroundColor: colors.surface },
          isDisabled && styles.disabled,
        ]}
        accessibilityRole={"radio"}
        accessibilityState={{ selected: active, disabled: isDisabled }}
      >
        {option.icon}
        {typeof option.label === "string" ? (
          <Text
            textStyle={active ? "Title_S2" : "Body_S2"}
            color={active ? "textPrimary" : "textSecondary"}
            numberOfLines={1}
          >
            {option.label}
          </Text>
        ) : (
          option.label
        )}
      </Touchable>
    );
  });

  const track = [styles.track, { backgroundColor: colors.onSurface }];

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={style}
        contentContainerStyle={track}
      >
        {items}
      </ScrollView>
    );
  }

  return <View style={[track, style]}>{items}</View>;
};

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    gap: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  itemFill: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
