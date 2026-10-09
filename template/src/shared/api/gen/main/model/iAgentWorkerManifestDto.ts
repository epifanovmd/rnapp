import type { IAgentManifestConfigDto } from "./iAgentManifestConfigDto";
import type { IAgentManifestEventDto } from "./iAgentManifestEventDto";
import type { IAgentManifestJobDto } from "./iAgentManifestJobDto";
import type { IAgentManifestRequestDto } from "./iAgentManifestRequestDto";
import type { IAgentManifestRouteDto } from "./iAgentManifestRouteDto";

/**
 * Манифест воркера — ответ `GET /manifest`: что воркер умеет (каталог
 * возможностей). Агент пропускает только объявленное: маршруты, типы задач,
 * события, запросы к серверу, ключи настроек.
 */
export interface IAgentWorkerManifestDto {
  version: string;
  description?: string;
  configs: IAgentManifestConfigDto[];
  routes: IAgentManifestRouteDto[];
  events: IAgentManifestEventDto[];
  jobs: IAgentManifestJobDto[];
  requests: IAgentManifestRequestDto[];
}
