/**
 * Какой процесс сервера держит соединение агента.
 */
export interface IAgentSessionDto {
  id: string;
  instance: string;
  since: number;
}
