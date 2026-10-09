import type { AgentDto } from "@shared/api/gen/main/model";
import React, { FC } from "react";

import { formatAgo, formatMoment } from "../lib/format";
import { AGENT_CONNECTION, agentConnection } from "../lib/status";
import { StatusViewTag } from "./StatusViewTag";

interface IAgentStatusTagProps {
  agent: Pick<AgentDto, "online" | "revoked" | "lastSeenAt">;
}

/** Связь агента с сервером: на связи, нет связи (с последней связью) или отозван. */
export const AgentStatusTag: FC<IAgentStatusTagProps> = ({ agent }) => {
  const connection = agentConnection(agent);
  const view = AGENT_CONNECTION[connection];

  if (connection !== "offline" || !agent.lastSeenAt) {
    return <StatusViewTag view={view} dot />;
  }

  return (
    <StatusViewTag
      view={{
        ...view,
        label: `${view.label} · ${formatAgo(agent.lastSeenAt)}`,
      }}
      message={`Последняя связь: ${formatMoment(agent.lastSeenAt)}`}
      dot
    />
  );
};
