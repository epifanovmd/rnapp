import { formatPercent, pointHost, usagePercent } from "@entities/agent";
import {
  NodeConfigTag,
  NodeStatusDot,
  NodeStatusTag,
  nodeWorkersSummary,
} from "@entities/node";
import type {
  IAgentMetricsPointDto,
  NodeDto,
} from "@shared/api/gen/main/model";
import {
  Col,
  Divider,
  IconButton,
  Row,
  Tag,
  Text,
  Touchable,
} from "@shared/ui";
import React, { FC, memo } from "react";

import { NodeCardMeta as Meta } from "./NodeCardMeta";

interface INodeCardProps {
  node: NodeDto;
  /** Последняя нагрузка узла. */
  load: IAgentMetricsPointDto | null;
  onPress: (node: NodeDto) => void;
  /** Меню действий; без обработчика — кнопки меню нет. */
  onActions?: (node: NodeDto) => void;
}

/** Подпись агента узла: версия и воркеры. */
const agentText = (node: NodeDto): string => {
  if (!node.agent) return "не установлен";

  const workers = nodeWorkersSummary(node);

  return [
    node.agent.version ?? "версия неизвестна",
    workers.total > 0 &&
      (workers.troubled
        ? `воркеров ${workers.total}, проблем ${workers.troubled}`
        : `воркеров ${workers.total}`),
  ]
    .filter(Boolean)
    .join(" · ");
};

/** Карточка узла: имя, адрес, статус, нагрузка, агент и владелец. */
export const NodeCard: FC<INodeCardProps> = memo(
  ({ node, load, onPress, onActions }) => {
    const host = pointHost(load);
    const loadText = host
      ? `ЦП ${formatPercent(host.cpuPercent)} · память ${formatPercent(
          usagePercent(host.memUsedBytes, host.memTotalBytes),
        )}`
      : "—";

    return (
      <Touchable
        bg={"surface"}
        radius={16}
        pa={16}
        gap={12}
        onPress={() => onPress(node)}
      >
        <Row alignItems={"center"} gap={12}>
          <Col flex={1} gap={4}>
            <Text textStyle={"Title_S1"} numberOfLines={1}>
              {node.name}
            </Text>
            <Row alignItems={"center"} gap={6}>
              <NodeStatusDot status={node.status} />
              <Text
                textStyle={"Caption_M3"}
                color={"textSecondary"}
                numberOfLines={1}
                flexShrink={1}
              >
                {node.host ?? "адрес не задан"}
              </Text>
            </Row>
          </Col>
          {!!onActions && (
            <IconButton
              name={"moreVertical"}
              size={20}
              color={"textSecondary"}
              accessibilityLabel={"Действия с узлом"}
              onPress={() => onActions(node)}
            />
          )}
        </Row>

        {!!node.description && (
          <Text textStyle={"Body_S2"} color={"textSecondary"} numberOfLines={2}>
            {node.description}
          </Text>
        )}

        <Row wrap alignItems={"center"} gap={6}>
          <NodeStatusTag node={node} />
          {!!node.agent && <NodeConfigTag config={node.config} />}
          {!!node.agent?.updateAvailable && (
            <Tag variant={"warning"} icon={"upgrade"}>
              {"есть обновление агента"}
            </Tag>
          )}
        </Row>

        <Divider />

        <Row gap={12}>
          <Meta label={"Агент"} value={agentText(node)} />
          <Meta label={"Нагрузка"} value={loadText} right />
        </Row>
        <Row gap={12}>
          <Meta label={"Владелец"} value={node.ownerName ?? "не назначен"} />
          <Meta
            label={"Создал"}
            value={node.createdByName ?? "неизвестно"}
            right
          />
        </Row>
      </Touchable>
    );
  },
);
