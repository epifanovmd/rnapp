/**
 * Тело записи настроек воркера.
 */
export interface ISetAgentConfigBody {
  /** Значение ключа — любой JSON; проверяется по схеме из манифеста воркера. */
  data: unknown;
}
