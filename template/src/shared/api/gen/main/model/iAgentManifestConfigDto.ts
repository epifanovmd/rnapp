import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Ключ настроек в манифесте воркера.
 */
export interface IAgentManifestConfigDto {
  key: string;
  description?: string;
  /** JSON Schema значения. */
  schema?: RecordStringUnknown;
}
