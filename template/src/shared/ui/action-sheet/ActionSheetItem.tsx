import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";

import { Col, Row } from "../flex-view";
import { Icon } from "../icon";
import { Text } from "../text";
import { Touchable } from "../touchable";
import type { IActionSheetItem } from "./action-sheet.types";

const ICON_BOX = 40;

interface IActionSheetItemProps {
  item: IActionSheetItem;
  onPress: (key: string) => void;
}

/** Строка шторки: иконка в круге, заголовок, подпись и стрелка. */
export const ActionSheetItem: FC<IActionSheetItemProps> = memo(
  ({ item, onPress }) => {
    const { colors } = useTheme();
    const accent = item.destructive ? colors.danger : colors.primary;

    return (
      <Touchable
        row={true}
        alignItems={"center"}
        gap={12}
        pa={16}
        disabled={item.disabled}
        style={item.disabled ? styles.disabled : undefined}
        ctx={item.key}
        onPress={onPress}
        accessibilityRole={"button"}
        accessibilityLabel={item.title}
        accessibilityHint={item.description}
      >
        {item.icon && (
          <Row
            centerContent={true}
            style={[styles.iconBox, { backgroundColor: accent }]}
          >
            <Icon name={item.icon} size={20} color={colors.primaryForeground} />
          </Row>
        )}
        <Col flex={1} gap={2}>
          <Text
            textStyle={"Title_S1"}
            color={item.destructive ? "danger" : "textPrimary"}
          >
            {item.title}
          </Text>
          {!!item.description && (
            <Text textStyle={"Caption_M1"} color={"textSecondary"}>
              {item.description}
            </Text>
          )}
        </Col>
        <Icon name={"chevronRight"} size={18} color={colors.textTertiary} />
      </Touchable>
    );
  },
);

const styles = StyleSheet.create({
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_BOX / 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
