import { NodeConfigTag } from "@entities/node";
import type { NodeDto } from "@shared/api/gen/main/model";
import { formatter } from "@shared/lib/utils";
import { Col, InfoRow, Row, Section, Text } from "@shared/ui";
import React, { FC } from "react";

interface INodeInfoCardProps {
  node: NodeDto;
}

/** Сведения узла: адрес, владелец, создатель, настройки воркеров, даты. */
export const NodeInfoCard: FC<INodeInfoCardProps> = ({ node }) => (
  <Section title={"Узел"}>
    {!!node.description && (
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {node.description}
      </Text>
    )}
    <Col gap={4}>
      <InfoRow label={"Адрес"} value={node.host ?? "не задан"} mono />
      <InfoRow label={"Владелец"} value={node.ownerName ?? "не назначен"} />
      <InfoRow label={"Создал"} value={node.createdByName ?? undefined} />
      <InfoRow label={"Имя агента"} value={node.agentName ?? undefined} mono />
      <InfoRow label={"Создан"} value={formatter.date.format(node.createdAt)} />
    </Col>
    {!!node.agentId && (
      <Row>
        <NodeConfigTag config={node.config} />
      </Row>
    )}
  </Section>
);
