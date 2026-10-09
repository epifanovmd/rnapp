import type { TAgentReleaseSource } from "./tAgentReleaseSource";

/**
 * Сборка воркера.
 */
export interface IAgentWorkerArtifactDto {
  os: string;
  arch: string;
  file: string;
  sha256: string;
  signature?: string;
  source: TAgentReleaseSource;
  /** Ссылка источника или путь от корня бэкенда. */
  url: string;
  name: string;
  version: string;
  /** Что запускать в сборке-архиве. */
  command?: string;
  stopTimeout?: string;
}
