import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";
import { StyleSheet } from "react-native";

import { Col, FlexProps, Row } from "../flex-view";
import { Icon, TIconName } from "../icon";
import { Text } from "../text";

export type TNoticeVariant = "info" | "success" | "warning" | "danger";

export interface INoticeProps extends FlexProps {
  variant?: TNoticeVariant;
  title?: string;
  description?: ReactNode;
  /** Действие справа или под текстом. */
  action?: ReactNode;
  children?: ReactNode;
}

const ICONS: Record<TNoticeVariant, TIconName> = {
  info: "info",
  success: "circleCheck",
  warning: "warning",
  danger: "circleAlert",
};

const COLORS: Record<TNoticeVariant, keyof TColorTheme> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

/** Плашка-уведомление внутри экрана: статус, предупреждение, ошибка. */
export const Notice: FC<INoticeProps> = memo(
  ({ variant = "info", title, description, action, children, ...rest }) => {
    const { colors } = useTheme();
    const tone = colors[COLORS[variant]];

    return (
      <Row
        style={[
          styles.notice,
          {
            backgroundColor: `${String(tone)}1A`,
            borderColor: `${String(tone)}4D`,
          },
        ]}
        {...rest}
      >
        <Icon name={ICONS[variant]} size={18} color={tone} />
        <Col flex={1} gap={4}>
          {!!title && <Text textStyle={"Title_S2"}>{title}</Text>}
          {typeof description === "string" ? (
            <Text textStyle={"Body_S2"} color={"textSecondary"}>
              {description}
            </Text>
          ) : (
            description
          )}
          {children}
          {!!action && <Row mt={4}>{action}</Row>}
        </Col>
      </Row>
    );
  },
);

const styles = StyleSheet.create({
  notice: {
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
