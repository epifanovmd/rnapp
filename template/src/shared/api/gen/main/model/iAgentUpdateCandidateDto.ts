/**
 * Агент, которого можно обновить до версии выпуска.
 */
export interface IAgentUpdateCandidateDto {
  agentId: string;
  name: string;
  online: boolean;
  current: string;
  target: string;
  os: string;
  arch: string;
}
