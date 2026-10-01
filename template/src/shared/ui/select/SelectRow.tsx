import { useTheme } from "@shared/lib/theme";
import React from "react";
import { StyleSheet } from "react-native";

import { Col } from "../flex-view";
import { Icon } from "../icon";
import { Text } from "../text";
import { Touchable } from "../touchable";

export interface ISelectRowProps {
  text: string;
  description?: string;
  active: boolean;
  muted?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export const SelectRow = ({
  text,
  description,
  active,
  muted,
  disabled,
  onPress,
}: ISelectRowProps) => {
  const { colors } = useTheme();

  return (
    <Touchable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.row,
        active && { backgroundColor: colors.onSurface },
        disabled && styles.disabled,
      ]}
      accessibilityRole={"radio"}
      accessibilityState={{ selected: active, disabled }}
    >
      <Col flex={1} gap={2}>
        <Text
          textStyle={active ? "Title_S2" : "Body_M2"}
          color={muted ? "textSecondary" : "textPrimary"}
        >
          {text}
        </Text>
        {!!description && (
          <Text textStyle={"Caption_M3"} color={"textSecondary"}>
            {description}
          </Text>
        )}
      </Col>
      {active && <Icon name={"check"} size={20} color={colors.primary} />}
    </Touchable>
  );
};

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
