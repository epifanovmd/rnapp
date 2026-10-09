import type { IAgentLogEntryDto } from "./iAgentLogEntryDto";

/**
 * Последние строки журнала.
 */
export interface IAgentLogsDto {
  entries: IAgentLogEntryDto[];
}
