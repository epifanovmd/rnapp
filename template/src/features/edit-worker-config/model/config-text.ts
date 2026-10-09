import { formatJson, schemaSkeleton } from "@entities/agent";

import type { IWorkerConfigTarget } from "./types";

/**
 * Текст редактора: заданное значение или заготовка по схеме ключа. Значение
 * сервер отдаёт только с правом на настройки — без него заготовки нет.
 */
export const initialConfigText = (target: IWorkerConfigTarget): string => {
  const config = target.entry?.config;

  if (config) return config.data === undefined ? "" : formatJson(config.data);

  return formatJson(schemaSkeleton(target.manifest?.schema));
};

/** Тело ошибки сервера: что именно не так — в `details.reason`. */
interface IConfigErrorBody {
  details?: { reason?: string };
}

/** Текст ошибки схемы: общий текст и причина, если сервер её назвал. */
export const invalidConfigText = (
  message: string,
  body: IConfigErrorBody | undefined,
): string => {
  const reason = body?.details?.reason;

  return reason ? `${message}. ${reason}` : message;
};
