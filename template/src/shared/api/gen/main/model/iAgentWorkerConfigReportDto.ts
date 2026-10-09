import type { IAgentErrorDto } from "./iAgentErrorDto";

/**
 * Что агент сообщил о ключе настроек: версия на диске и итог применения.
 */
export interface IAgentWorkerConfigReportDto {
  version: number;
  /** Нет — ещё применяется. */
  ok?: boolean;
  error?: IAgentErrorDto;
}
