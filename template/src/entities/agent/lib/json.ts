/** Значение как JSON с отступами; `undefined` — пустая строка. */
export const formatJson = (value: unknown): string =>
  value === undefined ? "" : JSON.stringify(value, null, 2);

/** Значение одной строкой для списков и подписей. */
export const formatJsonInline = (value: unknown): string =>
  value === undefined ? "" : JSON.stringify(value);

/** Разбор текста как JSON; пустой текст — `undefined`. */
export const parseJsonText = (
  text: string,
): { value: unknown } | { error: string } => {
  if (!text.trim()) return { value: undefined };

  try {
    return { value: JSON.parse(text) as unknown };
  } catch (error) {
    return { error: (error as Error).message };
  }
};
