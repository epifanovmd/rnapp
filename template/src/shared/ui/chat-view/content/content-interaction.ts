/**
 * Взаимодействия с контентом.
 *
 * Карта открыта тем же слиянием деклараций, что и `ChatContentMap`: новый тип
 * объявляет свои события и шлёт их через `emit`, не добавляя ни полей в
 * интерфейсы ядра, ни пропсов в `ChatView`. Хост получает всё одним
 * `onContentInteraction`.
 *
 * ```ts
 * declare module "@shared/ui/chat-view" {
 *   interface ChatInteractionMap { "app.location.open": { lat: number; lon: number } }
 * }
 * ```
 */
export interface ChatInteractionMap {
  "builtin.media.tap": { index: number };
  "builtin.file.tap": { index: number };
  "builtin.poll.option.tap": { pollId: string; optionId: string };
  "builtin.poll.detail.tap": { pollId: string };
}

export type ChatInteractionType = keyof ChatInteractionMap;

/** Событие взаимодействия в том виде, в каком его получает хост. */
export type ChatContentInteraction = {
  [T in ChatInteractionType]: {
    messageId: string;
    type: T;
    payload: ChatInteractionMap[T];
  };
}[ChatInteractionType];

/**
 * Отправка события из компонента контента. Стабильна по ссылке в пределах
 * сообщения — обработчики ячейки живут в ref и не перерисовывают строки.
 */
export type ChatContentEmit = <T extends ChatInteractionType>(
  type: T,
  payload: ChatInteractionMap[T],
) => void;
