import type { IAgentReleaseManifestDto } from "./iAgentReleaseManifestDto";
import type { IAgentUpdateCandidateDto } from "./iAgentUpdateCandidateDto";
import type { IAgentWorkerUpdateCandidateDto } from "./iAgentWorkerUpdateCandidateDto";

/**
 * Выпуск агента и кого можно обновить.
 */
export interface IAgentReleaseDto {
  /** `null` — нет ни источника выпусков агента, ни каталога выпуска. */
  manifest: IAgentReleaseManifestDto | null;
  candidates: IAgentUpdateCandidateDto[];
  workerCandidates: IAgentWorkerUpdateCandidateDto[];
}
