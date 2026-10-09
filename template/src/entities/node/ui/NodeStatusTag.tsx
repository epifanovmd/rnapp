import type { NodeDto } from "@shared/api/gen/main/model";
import { useNotifications } from "@shared/lib/notifications";
import { formatter } from "@shared/lib/utils";
import { Tag, Touchable } from "@shared/ui";
import React, { FC } from "react";

import { NODE_STATUS } from "../lib/status";

interface INodeStatusTagProps {
  node: Pick<NodeDto, "status" | "statusMessage"> & {
    agent?: Pick<NonNullable<NodeDto["agent"]>, "lastSeenAt"> | null;
  };
}

/**
 * Статус узла; пояснение сервера — по нажатию. Без связи — сколько прошло с
 * последней связи агента.
 */
export const NodeStatusTag: FC<INodeStatusTagProps> = ({ node }) => {
  const toast = useNotifications();
  const view = NODE_STATUS[node.status];
  const lastSeenAt = node.agent?.lastSeenAt;
  const since =
    node.status === "offline" && lastSeenAt
      ? formatter.date.formatDiff(new Date(lastSeenAt).toISOString())
      : null;
  const tag = (
    <Tag variant={view.variant} dot>
      {since ? `${view.label} · ${since}` : view.label}
    </Tag>
  );

  if (!node.statusMessage) return tag;

  const message = node.statusMessage;

  return (
    <Touchable onPress={() => toast.info(message, { title: view.label })}>
      {tag}
    </Touchable>
  );
};
