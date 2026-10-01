import { useTheme } from "@shared/lib/theme";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Icon } from "../../icon";
import { Text } from "../../text";

export interface ISelectTagProps {
  label: string;
  /** Без обработчика или при `disabled` крестика нет. */
  onRemove?: () => void;
  disabled?: boolean;
}

const hitSlop = { top: 8, right: 8, bottom: 8, left: 8 };

/** Тег выбранного значения в поле multi-Select. */
export const SelectTag = memo(
  ({ label, onRemove, disabled }: ISelectTagProps) => {
    const { colors } = useTheme();

    return (
      <View
        style={[
          styles.tag,
          { backgroundColor: colors.surface, borderColor: colors.border },
          disabled && styles.disabled,
        ]}
      >
        <Text textStyle={"Body_S2"} numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        {!!onRemove && !disabled && (
          <TouchableOpacity
            hitSlop={hitSlop}
            onPress={onRemove}
            accessibilityRole={"button"}
            accessibilityLabel={`Удалить ${label}`}
          >
            <Icon name={"close"} size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 160,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
