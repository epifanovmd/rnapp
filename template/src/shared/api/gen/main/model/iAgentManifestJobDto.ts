import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Тип задачи воркера в манифесте (`POST /jobs`).
 */
export interface IAgentManifestJobDto {
  type: string;
  description?: string;
  /** JSON Schema `data` задачи. */
  schema?: RecordStringUnknown;
}
