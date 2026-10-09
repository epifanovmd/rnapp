import type { RecordStringUnknown } from "./recordStringUnknown";
import type { TAgentLogLevel } from "./tAgentLogLevel";

/**
 * Запись журнала агента или воркера.
 */
export interface IAgentLogEntryDto {
  /** Время, мс. */
  at: number;
  level: TAgentLogLevel;
  /** `agent` или имя воркера. */
  source: string;
  msg: string;
  attrs?: RecordStringUnknown;
}
