import { Col, Text } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";

export interface IDemoSectionProps {
  title: string;
  description?: string;
  /** Расстояние между примерами секции. */
  gap?: number;
}

/** Секция демо: заголовок, опциональное описание, контент. */
export const DemoSection: FC<PropsWithChildren<IDemoSectionProps>> = ({
  title,
  description,
  gap = 12,
  children,
}) => (
  <Col gap={gap}>
    <Col gap={2}>
      <Text textStyle={"Title_S1"}>{title}</Text>
      {!!description && (
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          {description}
        </Text>
      )}
    </Col>
    {children}
  </Col>
);
