import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";

import { Col, FlexProps, Row } from "../flex-view";
import { Icon, TIconName } from "../icon";
import { Text } from "../text";

export interface IStatCardProps extends FlexProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: TIconName;
  /** Цвет иконки. */
  tone?: keyof TColorTheme;
}

/** Плитка метрики: подпись, крупное значение и подсказка. */
export const StatCard: FC<IStatCardProps> = memo(
  ({ label, value, hint, icon, tone = "primary", ...rest }) => {
    const { colors } = useTheme();

    return (
      <Col bg={"surface"} radius={16} pa={14} gap={6} flex={1} {...rest}>
        <Row alignItems={"center"} gap={6}>
          {!!icon && <Icon name={icon} size={16} color={colors[tone]} />}
          <Text
            textStyle={"Caption_M3"}
            color={"textSecondary"}
            numberOfLines={1}
            flexShrink={1}
          >
            {label}
          </Text>
        </Row>
        {typeof value === "string" || typeof value === "number" ? (
          <Text textStyle={"Title_L"} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          value
        )}
        {typeof hint === "string" ? (
          <Text
            textStyle={"Caption_M3"}
            color={"textTertiary"}
            numberOfLines={2}
          >
            {hint}
          </Text>
        ) : (
          hint
        )}
      </Col>
    );
  },
);
