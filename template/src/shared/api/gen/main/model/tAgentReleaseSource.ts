/**
 * Откуда сборка: `remote` — откуда берутся сборки агента (GitHub или ссылка),
 * `local` — каталог сборок воркеров проекта.
 */
export type TAgentReleaseSource =
  (typeof TAgentReleaseSource)[keyof typeof TAgentReleaseSource];

export const TAgentReleaseSource = {
  remote: "remote",
  local: "local",
} as const;
