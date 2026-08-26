/**
 * Отладочное логирование списка.
 *
 * Выключено по умолчанию: логи пишутся на каждом кадре скролла и сами влияют
 * на плавность. Включается точечно — `setListDebug(["scroll", "sticky"])` —
 * чтобы в выводе была одна тема, а не всё сразу.
 */
export type ListDebugTopic =
  "scroll" | "range" | "position" | "size" | "sticky" | "mvcp";

let enabledTopics: ListDebugTopic[] = [];

export const setListDebug = (topics: ListDebugTopic[]): void => {
  enabledTopics = topics;
};

export const isListDebugEnabled = (topic: ListDebugTopic): boolean =>
  enabledTopics.includes(topic);

const round = (value: number): number => Math.round(value * 100) / 100;

const format = (data?: Record<string, unknown>): string => {
  "worklet";

  if (!data) return "";

  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${key}=${typeof value === "number" ? round(value) : String(value)}`,
    )
    .join(" ");
};

/** Числа округляются: разница в сотых долях пикселя в логах только мешает. */
export const listDebug = (
  topic: ListDebugTopic,
  message: string,
  data?: Record<string, unknown>,
): void => {
  if (!enabledTopics.includes(topic)) return;

  console.log(`[list:${topic}] ${message} ${format(data)}`);
};

/**
 * Лог с UI-потока.
 *
 * Флаг передаётся значением: worklet захватывает замыкание при создании и
 * позднейшего изменения модульной переменной не увидит.
 */
export const listDebugWorklet = (
  enabled: boolean,
  message: string,
  data?: Record<string, number>,
): void => {
  "worklet";

  if (!enabled) return;

  console.log(`[list:ui] ${message} ${format(data)}`);
};
