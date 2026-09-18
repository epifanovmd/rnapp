/**
 * Тип для предопределённых ролей (автодополнение в IDE).
 */
export type KnownRole = (typeof KnownRole)[keyof typeof KnownRole];

export const KnownRole = {
  admin: "admin",
  user: "user",
  guest: "guest",
} as const;
