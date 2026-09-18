import type { MediaItemDtoSender } from "./mediaItemDtoSender";
import type { MessageAttachmentDto } from "./messageAttachmentDto";

export interface MediaItemDto {
  id: string;
  messageId: string;
  chatId: string;
  /** @nullable */
  senderId: string | null;
  attachments: MessageAttachmentDto[];
  createdAt: string;
  sender?: MediaItemDtoSender;
}
