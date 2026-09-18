import type { EMessageStatus } from "./eMessageStatus";
import type { EMessageType } from "./eMessageType";
import type { MessageAttachmentDto } from "./messageAttachmentDto";
import type { MessageDtoMentionsItem } from "./messageDtoMentionsItem";
import type { MessageDtoReactionsItem } from "./messageDtoReactionsItem";
import type { MessageDtoSender } from "./messageDtoSender";
import type { PollDto } from "./pollDto";

export interface MessageDto {
  id: string;
  /** Транзитный клиентский ID для дедупликации оптимистичных сообщений. */
  localId?: string;
  chatId: string;
  /** @nullable */
  senderId: string | null;
  type: EMessageType;
  status: EMessageStatus;
  /** @nullable */
  content: string | null;
  /** @nullable */
  replyToId: string | null;
  /** @nullable */
  forwardedFromId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  /** @nullable */
  pinnedAt: string | null;
  /** @nullable */
  pinnedById: string | null;
  keyboard: unknown | null;
  createdAt: string;
  updatedAt: string;
  sender?: MessageDtoSender;
  replyTo?: MessageDto | null;
  attachments: MessageAttachmentDto[];
  reactions: MessageDtoReactionsItem[];
  mentions: MessageDtoMentionsItem[];
  poll?: PollDto | null;
}
