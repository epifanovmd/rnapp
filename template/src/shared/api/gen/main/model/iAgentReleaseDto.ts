import type { IAgentReleaseManifestDto } from "./iAgentReleaseManifestDto";
import type { IAgentUpdateCandidateDto } from "./iAgentUpdateCandidateDto";
import type { IAgentWorkerUpdateCandidateDto } from "./iAgentWorkerUpdateCandidateDto";

/**
 * Сборки агента и кого можно обновить.
 */
export interface IAgentReleaseDto {
  /** `null` — нет ни источника сборок агента, ни каталога сборок воркеров. */
  manifest: IAgentReleaseManifestDto | null;
  candidates: IAgentUpdateCandidateDto[];
  workerCandidates: IAgentWorkerUpdateCandidateDto[];
}
