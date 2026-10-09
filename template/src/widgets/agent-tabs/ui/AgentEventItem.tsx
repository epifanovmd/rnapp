import {
  formatClock,
  formatJson,
  formatJsonInline,
  formatMoment,
} from "@entities/agent";
import type { IAgentEventDto } from "@shared/api/gen/main/model";
import { useNavigation } from "@shared/lib/navigation";
import { Col, Row, Tag, Text, Touchable } from "@shared/ui";
import React, { FC, useState } from "react";
import { ScrollView } from "react-native";

import { monoStyles } from "./mono-style";

interface IAgentEventItemProps {
  event: IAgentEventDto;
}

/** Задача, к которой относится событие (`data.jobId`). */
const jobIdOf = (data: unknown): string | null =>
  !!data &&
  typeof data === "object" &&
  "jobId" in data &&
  typeof data.jobId === "string"
    ? data.jobId
    : null;

/**
 * Событие воркера: время, воркер, тип, данные одной строкой (целиком — по
 * нажатию); `data` не по схеме манифеста — пометка и замечания сервера.
 */
export const AgentEventItem: FC<IAgentEventItemProps> = ({ event }) => {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);
  const jobId = jobIdOf(event.data);
  const hasData = event.data !== undefined;
  const problems = event.problems ?? [];

  return (
    <Touchable
      gap={4}
      pv={10}
      disabled={!hasData}
      onPress={() => setExpanded(value => !value)}
    >
      <Row wrap alignItems={"center"} gap={6}>
        <Text
          textStyle={"Caption_M3"}
          color={"textSecondary"}
          style={monoStyles.mono}
        >
          {formatClock(event.at)}
        </Text>
        <Tag variant={"secondary"}>{event.worker}</Tag>
        <Text textStyle={"Title_S2"} flexShrink={1}>
          {event.type}
        </Text>
        {problems.length > 0 && (
          <Tag variant={"warning"}>{"data не по схеме"}</Tag>
        )}
      </Row>
      <Text textStyle={"Caption_M3"} color={"textTertiary"}>
        {`на узле ${formatMoment(event.at)} · принято ${formatMoment(event.receivedAt)}`}
      </Text>
      {problems.map(problem => (
        <Text key={problem} textStyle={"Caption_M3"} color={"warning"}>
          {problem}
        </Text>
      ))}
      {!!jobId && (
        <Touchable
          alignSelf={"flex-start"}
          hitSlop={8}
          onPress={() => navigation.navigate("Jobs")}
        >
          <Text textStyle={"Caption_M3"} color={"primary"}>
            {`задача ${jobId.slice(0, 8)}`}
          </Text>
        </Touchable>
      )}
      {hasData &&
        (expanded ? (
          <Col bg={"onSurface"} radius={8} pa={8}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text textStyle={"Caption_M3"} style={monoStyles.mono} selectable>
                {formatJson(event.data)}
              </Text>
            </ScrollView>
          </Col>
        ) : (
          <Text
            textStyle={"Caption_M3"}
            color={"textSecondary"}
            style={monoStyles.mono}
            numberOfLines={1}
          >
            {formatJsonInline(event.data)}
          </Text>
        ))}
    </Touchable>
  );
};
