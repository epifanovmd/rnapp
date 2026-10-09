import type { AgentDto, IAgentWorkerDto } from "@shared/api/gen/main/model";

/** Вид бейджа: подпись и окраска. */
export interface IStatusView {
  label: string;
  variant: "success" | "warning" | "destructive" | "info" | "muted";
}

/** Связь агента с сервером. */
export type TAgentConnection = "online" | "offline" | "revoked";

export const AGENT_CONNECTION: Record<TAgentConnection, IStatusView> = {
  online: { label: "на связи", variant: "success" },
  offline: { label: "нет связи", variant: "warning" },
  revoked: { label: "отозван", variant: "destructive" },
};

export const agentConnection = (
  agent: Pick<AgentDto, "online" | "revoked">,
): TAgentConnection => {
  if (agent.revoked) return "revoked";

  return agent.online ? "online" : "offline";
};

const unknownView = (value: string): IStatusView => ({
  label: value,
  variant: "muted",
});

/** Состояние воркера у агента. */
const WORKER_STATE: Record<string, IStatusView> = {
  starting: { label: "запускается", variant: "muted" },
  running: { label: "работает", variant: "success" },
  backoff: { label: "перезапускается после сбоя", variant: "destructive" },
  stopped: { label: "остановлен", variant: "muted" },
  invalid: { label: "не зарегистрирован", variant: "destructive" },
};

export const workerStateView = (state: string): IStatusView =>
  WORKER_STATE[state] ?? unknownView(state);

/** Самочувствие по ответу `GET /health`; ответа нет — `null`. */
export const workerHealthView = (
  worker: IAgentWorkerDto,
): IStatusView | null => {
  const { health } = worker;

  if (!health) return null;
  if (!health.ok) return { label: "не в порядке", variant: "warning" };
  if (health.busy) return { label: "занят", variant: "info" };

  return { label: "в порядке", variant: "success" };
};

/** Отложенная замена: ждёт, пока воркер занят. */
const WORKER_PENDING: Record<string, IStatusView> = {
  restart: { label: "перезапуск — когда освободится", variant: "warning" },
  update: { label: "обновление — когда освободится", variant: "warning" },
};

export const workerPendingView = (pending: string): IStatusView =>
  WORKER_PENDING[pending] ?? unknownView(pending);

/** Воркер не работает или сам сообщил, что не в порядке. */
export const isWorkerTroubled = (worker: IAgentWorkerDto): boolean =>
  worker.state !== "running" || worker.health?.ok === false;

/** Статус ключа настроек воркера. */
const CONFIG_STATE: Record<string, IStatusView> = {
  pending: { label: "ждёт агента", variant: "muted" },
  applying: { label: "применяется", variant: "info" },
  applied: { label: "применено", variant: "success" },
  failed: { label: "ошибка", variant: "destructive" },
  deleting: { label: "удаляется", variant: "muted" },
};

export const configStateView = (state: string): IStatusView =>
  CONFIG_STATE[state] ?? unknownView(state);

/** Виды проблем агента. */
const AGENT_ALERT: Record<string, IStatusView> = {
  offline: { label: "нет связи", variant: "destructive" },
  workerDown: { label: "воркер упал", variant: "destructive" },
  workerInvalid: { label: "воркер не зарегистрирован", variant: "destructive" },
  workerUnhealthy: { label: "воркер не в порядке", variant: "warning" },
  configFailed: { label: "настройка не применилась", variant: "destructive" },
};

export const agentAlertView = (type: string): IStatusView =>
  AGENT_ALERT[type] ?? unknownView(type);
