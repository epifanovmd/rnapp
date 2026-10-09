import {
  ISocketTransport,
  useSocketEvent,
  useSocketRoom,
} from "@shared/lib/socket";
import { useEffect, useMemo, useState } from "react";

import {
  appendLogEntries,
  type IAgentLogEntry,
  isLogLevelShown,
  type TAgentLogLevel,
} from "../lib/log";
import type { IAgentLogEvent } from "./types";

/** Ответ сервера на `agent:log-level`. */
interface ILogLevelAck {
  ok: boolean;
}

/** Повтор уровня, пока сервер не впустил сокет в комнату агента. */
const LEVEL_RETRY_MS = 1000;
const LEVEL_RETRIES = 5;

/** Все источники записей. */
export const ALL_LOG_SOURCES = "*";

/**
 * Живой журнал агента и воркеров: записи `agent:log` из комнаты агента.
 * Уровень уходит серверу (`agent:log-level`) — записи приходят с него и
 * подробнее; показываются не ниже выбранного. `agentId: null` — не слушать.
 */
export const useAgentLog = (agentId: string | null) => {
  const socket = ISocketTransport.useInstance();
  const [level, setLevel] = useState<TAgentLogLevel>("info");
  const [source, setSource] = useState<string>(ALL_LOG_SOURCES);
  const [entries, setEntries] = useState<IAgentLogEntry[]>([]);
  // Переподключение: сервер снова слушает с уровня по умолчанию.
  const [joins, setJoins] = useState(0);

  useSocketRoom("agent", agentId, () => setJoins(count => count + 1));
  useSocketEvent<[IAgentLogEvent]>(
    "agent:log",
    event => {
      if (event.agentId === agentId) {
        setEntries(prev => appendLogEntries(prev, event.entries));
      }
    },
    agentId !== null,
  );

  useEffect(() => {
    if (!agentId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const send = (attempt: number) => {
      socket.emit(
        "agent:log-level",
        { agentId, level },
        (ack: ILogLevelAck) => {
          if (cancelled || ack?.ok || attempt >= LEVEL_RETRIES) return;
          timer = setTimeout(() => send(attempt + 1), LEVEL_RETRY_MS);
        },
      );
    };

    send(1);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [socket, agentId, level, joins]);

  const sources = useMemo(
    () => [...new Set(entries.map(entry => entry.source))].sort(),
    [entries],
  );

  const shown = entries.filter(
    entry =>
      isLogLevelShown(entry, level) &&
      (source === ALL_LOG_SOURCES || entry.source === source),
  );

  return {
    entries: shown,
    level,
    setLevel,
    source,
    setSource,
    sources,
    clear: () => setEntries([]),
  };
};
