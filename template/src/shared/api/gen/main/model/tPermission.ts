/**
 * Право — строка `domain:action` (или `domain:*` — wildcard). Модуль объявляет
 * свои права сам через `definePermissions`; каталог с подписями отдаёт
 * `GET /api/v1/permissions`.
 */
export type TPermission = string;
