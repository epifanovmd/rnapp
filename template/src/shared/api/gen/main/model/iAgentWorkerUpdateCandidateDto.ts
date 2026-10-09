/**
 * Воркер из выпуска, которого можно обновить.
 */
export interface IAgentWorkerUpdateCandidateDto {
  agentId: string;
  agentName: string;
  online: boolean;
  worker: string;
  current: string;
  target: string;
  os: string;
  arch: string;
}
