/**
 * Сводка настроек воркеров агента узла (ключи `воркер/ключ`):
 * - `synced` — всё заданное применено;
 * - `applying` — агент на связи, новая версия ещё не применена;
 * - `error` — воркер отказал в настройке;
 * - `awaitingAgent` — агента нет или он не на связи, а применить есть что.
 */
export type ENodeConfigStatus =
  (typeof ENodeConfigStatus)[keyof typeof ENodeConfigStatus];

export const ENodeConfigStatus = {
  synced: "synced",
  applying: "applying",
  error: "error",
  awaitingAgent: "awaitingAgent",
} as const;
