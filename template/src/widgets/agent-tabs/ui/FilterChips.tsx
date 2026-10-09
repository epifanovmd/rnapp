import { Chip } from "@shared/ui";
import React, { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";

export interface IFilterChipOption {
  value: string;
  label: string;
}

interface IFilterChipsProps {
  options: IFilterChipOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Выбор одного значения чипами в строку с горизонтальной прокруткой. */
export const FilterChips: FC<IFilterChipsProps> = ({
  options,
  value,
  onChange,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
  >
    {options.map(option => (
      <Chip
        key={option.value}
        text={option.label}
        isActive={option.value === value}
        onPress={() => onChange(option.value)}
        accessibilityRole={"togglebutton"}
        accessibilityState={{ checked: option.value === value }}
      />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { gap: 8 },
});
