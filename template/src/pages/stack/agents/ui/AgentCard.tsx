import { AgentStatusTag, agentSubtitle, workersSummary } from "@entities/agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import { Col, IconButton, Row, Tag, Text, Touchable } from "@shared/ui";
import React, { FC, memo } from "react";

interface IAgentCardProps {
  agent: AgentDto;
  /** Новая версия для обновления; нет — `null`. */
  updateTarget: string | null;
  alertsCount: number;
  onPress: (agent: AgentDto) => void;
  /** Меню действий; без обработчика — кнопки нет. */
  onActions?: (agent: AgentDto) => void;
}

/** Карточка агента: имя, узел, связь, версия, обновление, проблемы и воркеры. */
export const AgentCard: FC<IAgentCardProps> = memo(
  ({ agent, updateTarget, alertsCount, onPress, onActions }) => {
    const workers = workersSummary(agent);

    return (
      <Touchable
        bg={"surface"}
        radius={16}
        pa={16}
        gap={10}
        onPress={() => onPress(agent)}
      >
        <Row alignItems={"center"} gap={12}>
          <Col flex={1} gap={4}>
            <Text textStyle={"Title_S1"} numberOfLines={1}>
              {agent.name}
            </Text>
            <Text
              textStyle={"Caption_M3"}
              color={"textSecondary"}
              numberOfLines={1}
            >
              {agentSubtitle(agent)}
            </Text>
          </Col>
          {!!onActions && (
            <IconButton
              name={"moreVertical"}
              size={20}
              color={"textSecondary"}
              accessibilityLabel={"Действия с агентом"}
              onPress={() => onActions(agent)}
            />
          )}
        </Row>
        <Row wrap alignItems={"center"} gap={6}>
          <AgentStatusTag agent={agent} />
          {!!agent.version && <Tag variant={"muted"}>{agent.version}</Tag>}
          {!!updateTarget && (
            <Tag variant={"warning"} icon={"upgrade"}>
              {`доступна ${updateTarget}`}
            </Tag>
          )}
          {alertsCount > 0 && (
            <Tag variant={"destructive"}>{`проблем: ${alertsCount}`}</Tag>
          )}
        </Row>
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {workers.total
            ? `воркеров ${workers.total}${workers.troubled ? `, не в порядке ${workers.troubled}` : ""}`
            : "воркеров нет"}
        </Text>
      </Touchable>
    );
  },
);
