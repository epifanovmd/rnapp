import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { IParsedChatMessage } from "../data";

/**
 * Хвост, дописанный в конец списка с прошлого снимка.
 *
 * Это всё, что осталось от диффа сообщений: позицию держит сам список, и от
 * сравнения нужен один ответ — какие чужие сообщения приехали снизу.
 */
const appendedIncomingIds = (
  previous: IParsedChatMessage[],
  next: IParsedChatMessage[],
): string[] => {
  if (previous.length === 0 || next.length <= previous.length) return [];

  const previousIds = new Set(previous.map(message => message.id));
  const appended: string[] = [];

  for (let i = next.length - 1; i >= 0; i--) {
    const message = next[i];

    if (previousIds.has(message.id)) break;
    if (message.ownership === "theirs") appended.push(message.id);
  }

  return appended;
};

/**
 * Счётчик непрочитанных.
 *
 * Два режима: внутренний (чат сам считает чужие сообщения, приехавшие снизу,
 * и вычёркивает прочитанные) и внешний — когда хост задаёт число пропом
 * `unreadCount` (`-1` означает внутренний режим).
 *
 * Прочитанность приходит от списка: строка считается прочитанной, когда
 * пересекает `unreadVisibilityThreshold` в viewability-паре. Раньше долю
 * видимости приходилось считать вручную по геометрии на каждом кадре скролла.
 */
export interface IChatUnread {
  count: number;
  /** Учесть новые сообщения; вызывается при изменении списка. */
  track: (messages: IParsedChatMessage[]) => void;
  /** Отметить прочитанными (из viewability-колбэка списка). */
  markRead: (ids: readonly string[]) => void;
  clear: () => void;
}

export const useChatUnread = (externalCount: number): IChatUnread => {
  const [count, setCount] = useState(0);

  const idsRef = useRef(new Set<string>());
  const previousRef = useRef<IParsedChatMessage[]>([]);
  const isExternal = externalCount >= 0;
  const isExternalRef = useRef(isExternal);

  isExternalRef.current = isExternal;

  useEffect(() => {
    if (isExternal) setCount(externalCount);
  }, [isExternal, externalCount]);

  const track = useCallback((messages: IParsedChatMessage[]) => {
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
  }, []);

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

  return useMemo(
    () => ({ count, track, markRead, clear }),
    [count, track, markRead, clear],
  );
};
