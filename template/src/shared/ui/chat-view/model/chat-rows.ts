import { IParsedChatMessage } from "./chat-message";

/**
 * Порт ChatRow: message / dateSeparator / loading.
 */
export type ChatRow =
  | { type: "message"; message: IParsedChatMessage }
  | { type: "dateSeparator"; groupDate: string }
  | { type: "loading"; position: "top" | "bottom" };

/**
 * Порт ChatRow.differenceIdentifier: стабильная идентичность для diff —
 * `localId` (если есть) даёт pending→real обновление вместо delete+insert.
 */
export const chatRowKey = (row: ChatRow): string => {
  switch (row.type) {
    case "message":
      return `m_${row.message.localId ?? row.message.id}`;
    case "dateSeparator":
      return `d_${row.groupDate}`;
    case "loading":
      return `l_${row.position}`;
  }
};

export interface IBuildChatRowsInput {
  messages: IParsedChatMessage[];
  showDateSeparators: boolean;
  showBottomLoading: boolean;
}

/** Порт ChatViewController.buildRows(from:). */
export const buildChatRows = ({
  messages,
  showDateSeparators,
  showBottomLoading,
}: IBuildChatRowsInput): ChatRow[] => {
  const result: ChatRow[] = [];
  const seenGroups = new Set<string>();

  for (const msg of messages) {
    if (showDateSeparators && !seenGroups.has(msg.groupDate)) {
      seenGroups.add(msg.groupDate);
      result.push({ type: "dateSeparator", groupDate: msg.groupDate });
    }
    result.push({ type: "message", message: msg });
  }

  if (showBottomLoading) {
    result.push({ type: "loading", position: "bottom" });
  }

  return result;
};
