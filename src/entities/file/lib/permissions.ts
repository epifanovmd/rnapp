/** Права файлов; у обоих есть область «только свои» (`<право>:own`). */
export const FILE_PERMISSIONS = {
  /** Просмотр и ссылки. */
  VIEW: "file:view",
  /** Удаление. */
  DELETE: "file:delete",
} as const;
