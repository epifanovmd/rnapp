import { useTheme } from "@shared/lib/theme";
import React, { memo, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Checkbox } from "../../check-box";
import { Col } from "../../flex-view";
import { Icon } from "../../icon";
import { Text } from "../../text";
import { Touchable } from "../../touchable";

export interface ISelectOptionRowProps {
  /** Подпись опции или результат `optionRender`. */
  content: ReactNode;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  /** multi — чекбокс слева, single — галочка справа. */
  multi: boolean;
  onPress: () => void;
}

/** Строка опции в шторке. */
export const SelectOptionRow = memo(
  ({
    content,
    description,
    selected,
    disabled,
    multi,
    onPress,
  }: ISelectOptionRowProps) => {
    const { colors } = useTheme();
    const isText = typeof content === "string" || typeof content === "number";

    return (
      <Touchable
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.row,
          selected && !multi && { backgroundColor: colors.onSurface },
          disabled && styles.disabled,
        ]}
        accessibilityRole={multi ? "checkbox" : "radio"}
        accessibilityState={{ checked: selected, disabled: !!disabled }}
      >
        {multi && (
          <View pointerEvents={"none"}>
            <Checkbox isActive={selected} disabled={disabled} />
          </View>
        )}
        <Col flex={1} gap={2}>
          {isText ? (
            <Text textStyle={selected && !multi ? "Title_S2" : "Body_M2"}>
              {content}
            </Text>
          ) : (
            content
          )}
          {!!description && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {description}
            </Text>
          )}
        </Col>
        {selected && !multi && (
          <Icon name={"check"} size={20} color={colors.primary} />
        )}
      </Touchable>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
