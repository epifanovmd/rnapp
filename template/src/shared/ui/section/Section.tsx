import React, { FC, memo, PropsWithChildren } from "react";

import { Col, FlexProps } from "../flex-view";
import { Text } from "../text";

export interface ISectionProps extends FlexProps {
  title?: string;
  description?: string;
}

/** Карточка-секция экрана настроек: заголовок, описание и контент. */
export const Section: FC<PropsWithChildren<ISectionProps>> = memo(
  ({ title, description, children, ...rest }) => (
    <Col bg={"surface"} radius={16} pa={16} gap={12} {...rest}>
      {!!(title || description) && (
        <Col gap={4}>
          {!!title && <Text textStyle={"Title_S1"}>{title}</Text>}
          {!!description && (
            <Text textStyle={"Body_S2"} color={"textSecondary"}>
              {description}
            </Text>
          )}
        </Col>
      )}
      {children}
    </Col>
  ),
);
