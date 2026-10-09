import type { AgentAlertDto } from "@shared/api/gen/main/model";
import { Col, Divider, Row, Section, Text } from "@shared/ui";
import React, { FC, Fragment } from "react";

import { formatAgo } from "../lib/format";
import { agentAlertView } from "../lib/status";
import { StatusViewTag } from "./StatusViewTag";

interface IAgentAlertsCardProps {
  alerts: AgentAlertDto[];
  /** Показывать имя агента (общий список проблем). */
  withAgent?: boolean;
}

/** Активные проблемы агентов: вид, воркер, сообщение и с какого времени. */
export const AgentAlertsCard: FC<IAgentAlertsCardProps> = ({
  alerts,
  withAgent,
}) =>
  alerts.length === 0 ? null : (
    <Section title={"Проблемы"} description={"Что сейчас не так у агента"}>
      <Col>
        {alerts.map((alert, index) => (
          <Fragment key={`${alert.agentId}/${alert.key}`}>
            {index > 0 && <Divider />}
            <Col gap={4} pv={8}>
              <Row wrap alignItems={"center"} gap={6}>
                <StatusViewTag view={agentAlertView(alert.type)} />
                {withAgent && (
                  <Text textStyle={"Title_S2"}>{alert.agentName}</Text>
                )}
                {!!alert.worker && (
                  <Text textStyle={"Body_S2"} color={"textSecondary"}>
                    {[alert.worker, alert.configKey].filter(Boolean).join("/")}
                  </Text>
                )}
              </Row>
              <Text textStyle={"Body_S2"}>{alert.message}</Text>
              <Text textStyle={"Caption_M3"} color={"textTertiary"}>
                {`с ${formatAgo(alert.since)}`}
              </Text>
            </Col>
          </Fragment>
        ))}
      </Col>
    </Section>
  );
