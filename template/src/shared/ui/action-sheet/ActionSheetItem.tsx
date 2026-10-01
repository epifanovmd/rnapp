import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";

import { Col } from "../flex-view";
import { Icon } from "../icon";
import { Text } from "../text";
import { Touchable } from "../touchable";
import type { IActionSheetItem } from "./action-sheet.types";

interface IActionSheetItemProps {
  item: IActionSheetItem;
  onPress: (key: string) => void;
}

/** Действие шторки: иконка и подпись; опасное — красным, без стрелки перехода. */
export const ActionSheetItem: FC<IActionSheetItemProps> = memo(
  ({ item, onPress }) => {
    const { colors } = useTheme();
    const tone = item.destructive ? colors.danger : colors.textPrimary;

    return (
      <Touchable
        row
        alignItems={"center"}
        gap={14}
        ph={16}
        minHeight={52}
        pv={12}
        disabled={item.disabled}
        style={item.disabled ? styles.disabled : undefined}
        ctx={item.key}
        onPress={onPress}
        accessibilityRole={"button"}
        accessibilityLabel={item.title}
        accessibilityHint={item.description}
      >
        {!!item.icon && <Icon name={item.icon} size={20} color={tone} />}
        <Col flex={1} gap={2}>
          <Text
            textStyle={"Body_L1"}
            color={item.destructive ? "danger" : "textPrimary"}
          >
            {item.title}
          </Text>
          {!!item.description && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {item.description}
            </Text>
          )}
        </Col>
      </Touchable>
    );
  },
);

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
});
