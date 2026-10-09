import type { ENodeStatus } from "./eNodeStatus";
import type { INodeAgentDto } from "./iNodeAgentDto";
import type { INodeConfigDto } from "./iNodeConfigDto";
import type { INodeJobDto } from "./iNodeJobDto";

export interface NodeDto {
  id: string;
  name: string;
  /** @nullable */
  description: string | null;
  /**
   * Публичный адрес (имя хоста или IP).
   * @nullable
   */
  host: string | null;
  /**
   * Назначенный владелец.
   * @nullable
   */
  ownerId: string | null;
  /** @nullable */
  ownerName: string | null;
  /**
   * Создатель.
   * @nullable
   */
  createdById: string | null;
  /** @nullable */
  createdByName: string | null;
  /** @nullable */
  agentId: string | null;
  /**
   * Имя агента узла (остаётся и без агента): агент с этим именем,
   * зарегистрированный без метки узла, привязывается к этому узлу.
   * @nullable
   */
  agentName: string | null;
  /** Вычисленный статус (см. README модуля). */
  status: ENodeStatus;
  /**
   * Пояснение к статусу.
   * @nullable
   */
  statusMessage: string | null;
  /** Агент узла; `null` — агента нет (или запись агента удалена). */
  agent: INodeAgentDto | null;
  config: INodeConfigDto;
  /** Последняя задача установки или удаления агента. */
  job: INodeJobDto | null;
  createdAt: string;
  updatedAt: string;
}
