import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";

import { DisclosureRow,IDisclosureRowProps } from "../disclosure-row";
import { Col, Row } from "../flex-view";
import { Icon, TIconName } from "../icon";
import { Text } from "../text";

export interface IValueRowProps extends Omit<IDisclosureRowProps, "children"> {
  label: string;
  /** Значение справа: строка/число — вторичным текстом, иначе узел как есть. */
  value?: ReactNode;
  description?: string;
  icon?: TIconName;
  iconColor?: string;
}

/**
 * Строка настроек: иконка, подпись, значение справа; с `onPress` — переход
 * со стрелкой (DisclosureRow). Фон и горизонтальные отступы — у контейнера.
 */
export const ValueRow: FC<IValueRowProps> = memo(
  ({ label, value, description, icon, iconColor, ...rest }) => {
    const { colors } = useTheme();
    const isText = typeof value === "string" || typeof value === "number";

    return (
      <DisclosureRow pv={14} {...rest}>
        <Row alignItems={"center"} gap={12}>
          {!!icon && (
            <Icon
              name={icon}
              size={18}
              color={iconColor ?? colors.textSecondary}
            />
          )}
          <Col flex={1} gap={2}>
            <Text textStyle={"Body_M2"}>{label}</Text>
            {!!description && (
              <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                {description}
              </Text>
            )}
          </Col>
          {isText ? (
            <Text
              textStyle={"Body_M2"}
              color={"textSecondary"}
              numberOfLines={1}
              flexShrink={1}
            >
              {value}
            </Text>
          ) : (
            value
          )}
        </Row>
      </DisclosureRow>
    );
  },
);
