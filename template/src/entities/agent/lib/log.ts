import type {
  IAgentLogEntryDto,
  TAgentLogLevel,
} from "@shared/api/gen/main/model";

import { formatClock } from "./format";

export type { TAgentLogLevel };

/** Уровни журнала агента — от подробного к важному. */
export const AGENT_LOG_LEVELS: readonly TAgentLogLevel[] = [
  "debug",
  "info",
  "warn",
  "error",
];

export const AGENT_LOG_LEVEL_LABELS: Record<TAgentLogLevel, string> = {
  debug: "Всё",
  info: "Обычные",
  warn: "Предупреждения",
  error: "Ошибки",
};

/** Запись журнала агента или воркера. */
export type IAgentLogEntry = IAgentLogEntryDto;

/** Сколько записей держит живой журнал. */
export const AGENT_LOG_KEEP = 500;

/** Запись не ниже выбранного уровня. */
export const isLogLevelShown = (
  entry: Pick<IAgentLogEntry, "level">,
  level: TAgentLogLevel,
): boolean =>
  AGENT_LOG_LEVELS.indexOf(entry.level) >= AGENT_LOG_LEVELS.indexOf(level);

/** Новые записи — в конец, старые сверх `keep` отбрасываются. */
export const appendLogEntries = (
  prev: IAgentLogEntry[],
  add: IAgentLogEntry[],
  keep = AGENT_LOG_KEEP,
): IAgentLogEntry[] => [...prev, ...add].slice(-keep);

const formatAttr = (value: unknown): string =>
  typeof value === "string" ? value : JSON.stringify(value);

/** Строка журнала: «21:45:15 WARN  [agent] сообщение key=value». */
export const formatLogEntry = (entry: {
  at: number;
  level: string;
  source: string;
  msg: string;
  attrs?: Record<string, unknown>;
}): string =>
  [
    formatClock(entry.at),
    entry.level.toUpperCase().padEnd(5),
    `[${entry.source}]`,
    entry.msg,
    ...Object.entries(entry.attrs ?? {}).map(
      ([key, value]) => `${key}=${formatAttr(value)}`,
    ),
  ].join(" ");
