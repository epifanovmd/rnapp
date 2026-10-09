import type { AuditEventDto } from "@shared/api/gen/main/model";

/** Тип события: действие пользователя с агентом. */
const AGENT_ACTION = "agent.action";
/** Тип события: итог действия от агента. */
const AGENT_ACTION_RESULT = "agent.action-result";

/** Действия с агентом и воркерами по имени. */
const AGENT_ACTION_LABELS: Record<string, string> = {
  "agent.update": "обновление агента",
  "agent.rotateKey": "смена ключа агента",
  "agent.revoke": "отзыв агента",
  "agent.delete": "удаление агента",
  "agent.enroll": "регистрация агента",
  "worker.restart": "перезапуск воркера",
  "worker.update": "обновление воркера",
  "config.set": "запись настройки воркера",
  "config.delete": "удаление настройки воркера",
  fetch: "запрос к воркеру",
};

const STATUS_LABELS: Record<string, string> = {
  done: "выполнено",
  failed: "не выполнено",
};

const textOf = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

/** Воркер и ключ (или метод и путь запроса) из подробностей действия. */
const targetOf = (meta: Record<string, unknown>): string | null => {
  const args = meta.args;
  const fromArgs =
    !!args && typeof args === "object" && "name" in args
      ? textOf((args as { name: unknown }).name)
      : null;
  const worker = textOf(meta.worker) ?? fromArgs ?? textOf(meta.name);
  const request = [textOf(meta.method), textOf(meta.path)]
    .filter(Boolean)
    .join(" ");

  return (
    [[worker, textOf(meta.key)].filter(Boolean).join("/"), request]
      .filter(Boolean)
      .join(" ") || null
  );
};

/**
 * Событие журнала о действии с агентом одной строкой: что, над чем и итог;
 * другое событие — `null` (показывается его тип).
 */
export const agentAuditTitle = (
  event: Pick<AuditEventDto, "type" | "meta">,
): string | null => {
  if (event.type !== AGENT_ACTION && event.type !== AGENT_ACTION_RESULT) {
    return null;
  }

  const action = textOf(event.meta.action) ?? "действие";
  const label = AGENT_ACTION_LABELS[action] ?? action;
  const target = targetOf(event.meta);
  const status = textOf(event.meta.status);

  return [
    `Агент: ${label}`,
    target,
    event.type === AGENT_ACTION_RESULT && status
      ? (STATUS_LABELS[status] ?? status)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
};
