import type {
  IAgentConfigEntryDto,
  IAgentManifestConfigDto,
} from "@shared/api/gen/main/model";

/** Ключ настроек воркера: что объявил воркер и что задано на сервере. */
export interface IWorkerConfigTarget {
  agentId: string;
  worker: string;
  key: string;
  /** Ключ из манифеста воркера (описание и схема); нет в манифесте — `null`. */
  manifest: IAgentManifestConfigDto | null;
  /** Заданное значение и статус применения; ключ не задан — `null`. */
  entry: IAgentConfigEntryDto | null;
}
