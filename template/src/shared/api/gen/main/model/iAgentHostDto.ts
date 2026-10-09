/**
 * Узел агента.
 */
export interface IAgentHostDto {
  os: string;
  arch: string;
  hostname: string;
  kernel?: string;
}
