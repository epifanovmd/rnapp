import { ChatFileItem, ChatPoll } from "../types";

/**
 * Словарь типов контента сообщения: `id типа → данные этого типа`.
 *
 * Карта открыта для расширения — приложение добавляет свои типы слиянием
 * деклараций, не трогая shared:
 *
 * ```ts
 * declare module "@shared/ui/chat-view" {
 *   interface ChatContentMap { "app.location": ILocationContent }
 * }
 * ```
 *
 * Благодаря этому `ChatContentBlock` остаётся размеченным объединением
 * (exhaustive-switch продолжает работать), но не является закрытым.
 */

/** Элемент сетки вложений: изображение или видео. */
export interface IChatMediaItem {
  isVideo: boolean;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface IChatImagesContent {
  items: IChatMediaItem[];
}

export interface IChatVoiceContent {
  url: string;
  duration: number;
  waveform: number[];
}

export interface IChatPollContent {
  poll: ChatPoll;
}

export interface IChatFilesContent {
  items: ChatFileItem[];
}

export interface ChatContentMap {
  "builtin.images": IChatImagesContent;
  "builtin.voice": IChatVoiceContent;
  "builtin.poll": IChatPollContent;
  "builtin.files": IChatFilesContent;
}

/** Идентификатор типа контента. */
export type ChatContentTypeId = keyof ChatContentMap;

/** Разобранный блок контента: данные плюс метка типа. */
export type ChatContentBlock = {
  [K in ChatContentTypeId]: { type: K } & ChatContentMap[K];
}[ChatContentTypeId];
