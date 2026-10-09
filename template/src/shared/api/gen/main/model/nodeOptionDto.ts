/**
 * Краткая запись для выпадающих списков.
 */
export interface NodeOptionDto {
  id: string;
  name: string;
  /** @nullable */
  host: string | null;
  /** @nullable */
  agentId: string | null;
}
