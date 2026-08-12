import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { IParsedChatMessage } from "../data";

/** Чужие сообщения, дописанные в конец списка с прошлого снимка. */
const appendedIncomingIds = (
  previous: IParsedChatMessage[],
  next: IParsedChatMessage[],
): string[] => {
  if (previous.length === 0 || next.length <= previous.length) return [];

  const appended: string[] = [];

  // Типичное обновление — чистое дописывание в конец: прежний хвост стоит на
  // том же месте той же ссылкой (конвейер сохраняет идентичность). Тогда новые
  // сообщения — ровно всё после него, без построения множества прежних id.
  if (next[previous.length - 1] === previous[previous.length - 1]) {
    for (let i = previous.length; i < next.length; i++) {
      if (next[i].ownership === "theirs") appended.push(next[i].id);
    }

    return appended;
  }

  const previousIds = new Set(previous.map(message => message.id));

  for (let i = next.length - 1; i >= 0; i--) {
    const message = next[i];

    if (previousIds.has(message.id)) break;
    if (message.ownership === "theirs") appended.push(message.id);
  }

  return appended;
};

export interface IChatUnread {
  count: number;
  /** Отметить прочитанными; вызывается из viewability-колбэка списка. */
  markRead: (ids: readonly string[]) => void;
  clear: () => void;
}

/**
 * Счётчик непрочитанных в двух режимах: внутренний считает чужие сообщения,
 * приехавшие снизу, внешний берёт число из пропа (`-1` — внутренний).
 */
export const useChatUnread = (
  externalCount: number,
  messages: IParsedChatMessage[],
): IChatUnread => {
  const [count, setCount] = useState(0);

  const idsRef = useRef(new Set<string>());
  const previousRef = useRef<IParsedChatMessage[]>([]);
  const isExternal = externalCount >= 0;
  const isExternalRef = useRef(isExternal);

  isExternalRef.current = isExternal;

  useEffect(() => {
    if (isExternal) setCount(externalCount);
  }, [isExternal, externalCount]);

  useEffect(() => {
    const previous = previousRef.current;

    previousRef.current = messages;

    if (isExternalRef.current) return;

    const appended = appendedIncomingIds(previous, messages);

    if (appended.length === 0) return;

    const ids = idsRef.current;

    for (const id of appended) {
      ids.add(id);
    }
    setCount(ids.size);
  }, [messages]);

  const markRead = useCallback((readIds: readonly string[]) => {
    if (isExternalRef.current) return;

    const ids = idsRef.current;
    let changed = false;

    for (const id of readIds) {
      changed = ids.delete(id) || changed;
    }

    if (changed) setCount(ids.size);
  }, []);

  const clear = useCallback(() => {
    idsRef.current.clear();
    setCount(0);
  }, []);

  return useMemo(() => ({ count, markRead, clear }), [count, markRead, clear]);
};
