import type { INodeAgentHostDto } from "./iNodeAgentHostDto";
import type { INodeAgentWorkerDto } from "./iNodeAgentWorkerDto";

/**
 * Агент узла кратко.
 */
export interface INodeAgentDto {
  id: string;
  name: string;
  online: boolean;
  revoked: boolean;
  /**
   * Версия агента.
   * @nullable
   */
  version: string | null;
  /**
   * Адрес последнего подключения.
   * @nullable
   */
  address: string | null;
  /**
   * Последнее сообщение, мс.
   * @nullable
   */
  lastSeenAt: number | null;
  host: INodeAgentHostDto | null;
  /** Есть другая версия агента под этот узел. */
  updateAvailable: boolean;
  /** Воркеры: имя, состояние, версия, самочувствие. */
  workers: INodeAgentWorkerDto[];
}
