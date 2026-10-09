import { Col, Text } from "@shared/ui";
import React, { FC } from "react";

interface INodeCardMetaProps {
  label: string;
  value: string;
  /** Выровнять по правому краю. */
  right?: boolean;
}

/** Колонка «подпись / значение» низа карточки узла. */
export const NodeCardMeta: FC<INodeCardMetaProps> = ({
  label,
  value,
  right,
}) => (
  <Col flex={1} gap={2} alignItems={right ? "flex-end" : "flex-start"}>
    <Text textStyle={"Caption_M3"} color={"textTertiary"} numberOfLines={1}>
      {label}
    </Text>
    <Text textStyle={"Body_S2"} numberOfLines={1}>
      {value}
    </Text>
  </Col>
);
