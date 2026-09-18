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
  "contact:view": "contact:view",
  "contact:manage": "contact:manage",
  "contact:*": "contact:*",
  "chat:view": "chat:view",
  "chat:manage": "chat:manage",
  "chat:*": "chat:*",
  "message:view": "message:view",
  "message:manage": "message:manage",
  "message:*": "message:*",
  "push:manage": "push:manage",
} as const;
