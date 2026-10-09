import { z } from "zod";

import { parseJsonText } from "../lib/json";

/** Имя воркера или ключа настроек: как в пути API. */
const WORKER_NAME = /^[a-z][a-z0-9-]{0,31}$/;

export const workerNameSchema = z
  .string()
  .trim()
  .regex(
    WORKER_NAME,
    "Строчная латиница, цифры и «-», с буквы — до 32 символов.",
  );

/** Поле с JSON: пусто или верный JSON. */
export const jsonTextSchema = z.string().superRefine((text, ctx) => {
  const parsed = parseJsonText(text);

  if ("error" in parsed) {
    ctx.addIssue({ code: "custom", message: `Неверный JSON: ${parsed.error}` });
  }
});

/** Необязательная строка: пустая — `undefined`. */
export const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Не длиннее ${max} символов.`)
    .optional()
    .transform(value => value || undefined);
