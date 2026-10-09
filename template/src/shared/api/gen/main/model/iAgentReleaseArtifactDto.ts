import type { TAgentReleaseSource } from "./tAgentReleaseSource";

/**
 * Сборка агента.
 */
export interface IAgentReleaseArtifactDto {
  os: string;
  arch: string;
  file: string;
  sha256: string;
  signature?: string;
  source: TAgentReleaseSource;
  /** Ссылка источника или путь от корня бэкенда. */
  url: string;
}
