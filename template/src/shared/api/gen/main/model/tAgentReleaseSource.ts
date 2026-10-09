/**
 * Откуда сборка: `remote` — источник выпусков агента (GitHub или ссылка),
 * `local` — каталог выпуска воркеров проекта.
 */
export type TAgentReleaseSource =
  (typeof TAgentReleaseSource)[keyof typeof TAgentReleaseSource];

export const TAgentReleaseSource = {
  remote: "remote",
  local: "local",
} as const;
