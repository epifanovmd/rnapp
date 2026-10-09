import type { AgentConfigStatusDto } from "./agentConfigStatusDto";
import type { IAgentConfigDto } from "./iAgentConfigDto";

/**
 * Ключ настроек: значение (если задано) и статус применения.
 */
export interface IAgentConfigEntryDto {
  worker: string;
  key: string;
  /** Желаемое значение; нет — ключ удалён и ещё удаляется на агенте. */
  config?: IAgentConfigDto;
  status: AgentConfigStatusDto;
}
