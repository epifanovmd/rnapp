import type { ENodeConfigStatus } from "./eNodeConfigStatus";

/**
 * Сводка настроек воркеров агента (ключи `воркер/ключ`).
 */
export interface INodeConfigDto {
  status: ENodeConfigStatus;
  /** Ключи, где заданная версия ещё не применена. */
  pending: string[];
  /** Ключи, где воркер отказал. */
  failed: string[];
}
