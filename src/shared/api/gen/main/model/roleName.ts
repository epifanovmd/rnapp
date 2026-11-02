/**
 * Имя роли в теле запроса API. Обычная строка: `TRole` с `string & {}`
 * tsoa проверить не может и отклоняет любое значение. Известные роли — `Roles`.
 * @minLength 1
 * @maxLength 100
 */
export type RoleName = string;
