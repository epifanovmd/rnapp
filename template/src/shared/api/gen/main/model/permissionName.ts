/**
 * Имя права в теле запроса API (`домен:действие`). Обычная строка: `TPermission`
 * с `string & {}` tsoa проверить не может. Известные права — `Permissions`.
 * @minLength 1
 * @maxLength 100
 */
export type PermissionName = string;
