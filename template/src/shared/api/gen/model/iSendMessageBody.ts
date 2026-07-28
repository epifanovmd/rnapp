import type { EMessageType } from "./eMessageType";

export interface ISendMessageBody {
  type?: EMessageType;
  content?: string;
  replyToId?: string;
  forwardedFromId?: string;
  fileIds?: string[];
  mentionedUserIds?: string[];
  mentionAll?: boolean;
  /** Клиентский ID для дедупликации оптимистичных сообщений. Транзитное поле — не сохраняется в БД. */
  localId?: string;
}
