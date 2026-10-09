/**
 * Статус узла — вычисляется при выдаче, не хранится:
 * - `created` — агента нет и задачи установки нет («Ожидает агента»);
 * - `provisioning` — идёт задача установки или удаления агента;
 * - `online` / `offline` — агент на связи или нет;
 * - `error` — последняя задача установки провалилась и агента нет, либо у
 *   агента на связи воркер не зарегистрирован (`invalid`), упал или не в
 *   порядке (`health.ok: false`), или воркер отказал в настройке.
 */
export type ENodeStatus = (typeof ENodeStatus)[keyof typeof ENodeStatus];

export const ENodeStatus = {
  created: "created",
  provisioning: "provisioning",
  online: "online",
  offline: "offline",
  error: "error",
} as const;
