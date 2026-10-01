import { useTheme } from "@shared/lib/theme";
import React, { memo, ReactNode } from "react";
import { StyleSheet } from "react-native";

import { Icon, TIconName } from "../../icon";
import { Text } from "../../text";
import { Touchable } from "../../touchable";

export interface ISelectActionRowProps {
  icon?: TIconName;
  /** Строка или свой узел (например, `createLabel`). */
  children: ReactNode;
  /** Подсветка, как у выбранной опции. */
  active?: boolean;
  /** Приглушённый текст. */
  muted?: boolean;
  onPress: () => void;
}

/** Служебная строка списка: «Не выбрано», «Создать «запрос»». */
export const SelectActionRow = memo(
  ({ icon, children, active, muted, onPress }: ISelectActionRowProps) => {
    const { colors } = useTheme();
    const isText = typeof children === "string";

    return (
      <Touchable
        onPress={onPress}
        style={[styles.row, active && { backgroundColor: colors.onSurface }]}
        accessibilityRole={"button"}
      >
        {!!icon && <Icon name={icon} size={20} color={colors.primary} />}
        {isText ? (
          <Text
            flex={1}
            textStyle={"Body_M2"}
            color={muted ? "textSecondary" : "textPrimary"}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {active && <Icon name={"check"} size={20} color={colors.primary} />}
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
});
