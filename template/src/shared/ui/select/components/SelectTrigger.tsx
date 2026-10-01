import { useTheme } from "@shared/lib/theme";
import React, { ReactNode } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Col } from "../../flex-view";
import { Icon } from "../../icon";
import { Spinner } from "../../spinner";
import { Text } from "../../text";
import { Touchable } from "../../touchable";

export interface ISelectTriggerProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Крестик очистки вместо шеврона. */
  showClear?: boolean;
  /** Шеврон справа (у Autocomplete его нет). */
  showChevron?: boolean;
  onPress: () => void;
  onClear?: () => void;
  /** Значение: текст, теги или свой узел. */
  children: ReactNode;
}

const hitSlop = { top: 12, right: 12, bottom: 12, left: 12 };

/**
 * Поле-триггер в стиле TextField: подпись и значение внутри, справа —
 * спиннер, крестик очистки или шеврон; под полем — ошибка или подсказка.
 */
export const SelectTrigger = ({
  label,
  description,
  errorMessage,
  disabled,
  loading,
  showClear,
  showChevron = true,
  onPress,
  onClear,
  children,
}: ISelectTriggerProps) => {
  const { colors } = useTheme();

  const renderAccessory = () => {
    if (loading) return <Spinner size={18} />;
    if (showClear) {
      return (
        <TouchableOpacity
          hitSlop={hitSlop}
          onPress={onClear}
          accessibilityRole={"button"}
          accessibilityLabel={"Очистить"}
        >
          <Icon
            name={"closeCircleFilled"}
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      );
    }
    if (showChevron) {
      return (
        <Icon name={"chevronDown"} size={20} color={colors.textTertiary} />
      );
    }

    return null;
  };

  const footer = errorMessage || description;

  return (
    <Col gap={4}>
      <Touchable
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.field,
          { backgroundColor: colors.onSurface },
          !!errorMessage && { borderColor: colors.danger },
          disabled && styles.disabled,
        ]}
        accessibilityRole={"button"}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
      >
        <Col flex={1} gap={2}>
          {!!label && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {label}
            </Text>
          )}
          {children}
        </Col>
        {renderAccessory()}
      </Touchable>
      {!!footer && (
        <Text
          textStyle={"Caption_M3"}
          color={errorMessage ? "danger" : "textSecondary"}
          mh={16}
        >
          {footer}
        </Text>
      )}
    </Col>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
});
