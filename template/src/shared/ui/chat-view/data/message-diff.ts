import { IParsedChatMessage } from "./chat-message";

/**
 * Порт MessageDiff: классификация обновлений массива сообщений.
 */

export interface IPendingMapping {
  oldToNew: Map<string, string>;
  newToOld: Map<string, string>;
}

/** Pending→real: старое и новое сообщение с общим localId, но разными id. */
export const buildPendingMapping = (
  old: IParsedChatMessage[],
  next: IParsedChatMessage[],
): IPendingMapping => {
  const oldIDs = new Set(old.map(m => m.id));
  const newIDs = new Set(next.map(m => m.id));

  const oldByLocalId = new Map<string, IParsedChatMessage>();

  for (const msg of old) {
    if (!newIDs.has(msg.id) && msg.localId) {
      oldByLocalId.set(msg.localId, msg);
    }
  }

  const oldToNew = new Map<string, string>();
  const newToOld = new Map<string, string>();

  for (const msg of next) {
    if (!oldIDs.has(msg.id) && msg.localId) {
      const oldMsg = oldByLocalId.get(msg.localId);

      if (oldMsg) {
        oldToNew.set(oldMsg.id, msg.id);
        newToOld.set(msg.id, oldMsg.id);
      }
    }
  }

  return { oldToNew, newToOld };
};

export const isPrependOnly = (
  old: IParsedChatMessage[],
  next: IParsedChatMessage[],
): boolean => {
  if (next.length <= old.length) return false;
  const offset = next.length - old.length;

  for (let i = 0; i < old.length; i++) {
    if (old[i].id !== next[i + offset].id) return false;
  }

  return true;
};

export const isAppendOnly = (
  old: IParsedChatMessage[],
  next: IParsedChatMessage[],
): boolean => {
  if (next.length <= old.length) return false;

  for (let i = 0; i < old.length; i++) {
    if (old[i].id !== next[i].id) return false;
  }

  return true;
};

/** ID сообщений, удалённых в новом массиве (для эффекта распада). */
export const deletedMessageIds = (
  old: IParsedChatMessage[],
  next: IParsedChatMessage[],
): Set<string> => {
  const newIDs = new Set(next.map(m => m.id));
  const mapping = buildPendingMapping(old, next);
  const deleted = new Set<string>();

  for (const msg of old) {
    if (!newIDs.has(msg.id) && !mapping.oldToNew.has(msg.id)) {
      deleted.add(msg.id);
    }
  }

  return deleted;
};
