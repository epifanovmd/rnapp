import type { AgentAlertDto } from "./agentAlertDto";
import type { IAgentHostDto } from "./iAgentHostDto";
import type { IAgentMetricsPointDto } from "./iAgentMetricsPointDto";
import type { IAgentSessionDto } from "./iAgentSessionDto";
import type { IAgentWorkerDto } from "./iAgentWorkerDto";
import type { RecordStringString } from "./recordStringString";

/**
 * Агент, как его видит бэкенд: связь, узел, воркеры (состояние, самочувствие,
 * манифест, настройки), последняя точка метрик, текущие проблемы.
 */
export interface AgentDto {
  id: string;
  name: string;
  labels: RecordStringString;
  online: boolean;
  revoked: boolean;
  /** Время регистрации, мс. */
  enrolledAt: number;
  lastSeenAt?: number;
  connectedAt?: number;
  /** IP последнего подключения. */
  address?: string;
  /** Версия агента. */
  version?: string;
  bootId?: string;
  startedAt?: number;
  host?: IAgentHostDto;
  workers: IAgentWorkerDto[];
  /** Когда пришёл последний `status`, мс. */
  statusAt?: number;
  /** Сколько важных сообщений агента ждут подтверждения. */
  outbox?: number;
  /** Последняя точка метрик. */
  metrics?: IAgentMetricsPointDto;
  alerts: AgentAlertDto[];
  session?: IAgentSessionDto;
}
