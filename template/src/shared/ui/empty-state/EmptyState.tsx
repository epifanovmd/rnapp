import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";

import { Col, FlexProps } from "../flex-view";
import { Icon, TIconName } from "../icon";
import { Text } from "../text";

export interface IEmptyStateProps extends FlexProps {
  icon?: TIconName;
  title: string;
  description?: string;
  /** Действие под текстом (кнопка «Создать», «Повторить»). */
  action?: ReactNode;
}

/** Пустое состояние списка или раздела. */
export const EmptyState: FC<IEmptyStateProps> = memo(
  ({ icon = "list", title, description, action, ...rest }) => {
    const { colors } = useTheme();

    return (
      <Col alignItems={"center"} gap={8} pv={32} ph={24} {...rest}>
        <Col
          circle={56}
          centerContent
          bg={"onSurface"}
          mb={4}
          accessibilityElementsHidden
        >
          <Icon name={icon} size={26} color={colors.textSecondary} />
        </Col>
        <Text textStyle={"Title_S1"} textAlign={"center"}>
          {title}
        </Text>
        {!!description && (
          <Text
            textStyle={"Body_S2"}
            color={"textSecondary"}
            textAlign={"center"}
          >
            {description}
          </Text>
        )}
        {!!action && <Col mt={8}>{action}</Col>}
      </Col>
    );
  },
);
