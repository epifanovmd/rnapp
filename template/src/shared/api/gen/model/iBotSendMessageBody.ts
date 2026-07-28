import type { EMessageType } from "./eMessageType";

export interface IBotSendMessageBody {
  chatId: string;
  content?: string;
  type?: EMessageType;
  replyToId?: string;
  fileIds?: string[];
}
