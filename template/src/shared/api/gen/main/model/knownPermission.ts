/**
 * Тип для предопределённых permissions (автодополнение в IDE).
 */
export type KnownPermission =
  (typeof KnownPermission)[keyof typeof KnownPermission];

export const KnownPermission = {
  "*": "*",
  "user:view": "user:view",
  "user:manage": "user:manage",
  "role:view": "role:view",
  "role:manage": "role:manage",
  "profile:view": "profile:view",
  "profile:manage": "profile:manage",
  "apikey:manage": "apikey:manage",
  "audit:view": "audit:view",
} as const;
