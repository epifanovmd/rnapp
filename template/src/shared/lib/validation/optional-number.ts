import { z } from "zod";

/**
 * Необязательное число из `NumberInputFormField`: пустое поле хранится как
 * `null`, а `z.number().optional()` принимает только `undefined` — форма с
 * очищенным полем не отправится. Ограничения задаются исходной схемой.
 *
 * @example mtu: optionalNumber(z.number().int().min(1280).max(9000))
 */
export const optionalNumber = <TSchema extends z.ZodType<number>>(
  schema: TSchema,
) => schema.nullable().optional();
