import type { IAgentActionEvent } from "@entities/agent";

const WORKER_ACTIONS: Record<string, { done: string; failed: string }> = {
  "worker.restart": { done: "перезапущен", failed: "не перезапущен" },
  "worker.update": { done: "обновлён", failed: "не обновлён" },
};

/** Уведомление об итоге отложенной замены воркера. */
export interface IWorkerActionNotice {
  ok: boolean;
  /** Текст уведомления; у провала — причина. */
  message: string;
  /** Заголовок уведомления о провале. */
  title?: string;
}

/** Имя воркера в аргументах действия (`args.name`). */
const workerOfEvent = (event: IAgentActionEvent): string | null =>
  typeof event.args?.name === "string" ? event.args.name : null;

const versionOf = (result: unknown): string | null =>
  typeof result === "object" &&
  result !== null &&
  "version" in result &&
  typeof result.version === "string"
    ? result.version
    : null;

/**
 * Итог отложенной замены воркера агента `agentId` из события `agent:action`;
 * другое событие (не тот агент, не отложенная замена воркера) — `null`.
 */
export const workerActionNotice = (
  event: IAgentActionEvent,
  agentId: string | null,
  /** Воркер из ожидания замены — если в событии имени нет. */
  trackedWorker?: string,
): IWorkerActionNotice | null => {
  const texts = WORKER_ACTIONS[event.name];

  if (!agentId || event.agentId !== agentId || !event.deferred || !texts) {
    return null;
  }

  const worker = workerOfEvent(event) ?? trackedWorker ?? "?";

  if (event.status === "done") {
    const version = versionOf(event.result);

    return {
      ok: true,
      message: `Воркер «${worker}» ${texts.done}${version ? `: версия ${version}` : ""}`,
    };
  }

  return {
    ok: false,
    message: event.error?.message ?? "Агент не выполнил замену",
    title: `Воркер «${worker}» ${texts.failed}`,
  };
};
