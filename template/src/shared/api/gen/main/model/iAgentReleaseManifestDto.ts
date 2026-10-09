import type { IAgentReleaseArtifactDto } from "./iAgentReleaseArtifactDto";
import type { IAgentReleaseRemoteDto } from "./iAgentReleaseRemoteDto";
import type { IAgentWorkerArtifactDto } from "./iAgentWorkerArtifactDto";

/**
 * Выпуск, который раздаёт бэкенд: агент и netprobe — из источника выпусков
 * агента, воркеры проекта — из `AGENT_RELEASES_DIR`.
 */
export interface IAgentReleaseManifestDto {
  version: string;
  /** Ключ, которым подписан выпуск (base64). */
  publicKey?: string;
  artifacts: IAgentReleaseArtifactDto[];
  workers?: IAgentWorkerArtifactDto[];
  /** Нет — источник выпусков агента не задан или ещё не ответил. */
  remote?: IAgentReleaseRemoteDto;
}
