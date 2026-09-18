import type { EMessageType } from "./eMessageType";

export interface ChatLastMessageDto {
  id: string;
  /** @nullable */
  content: string | null;
  type: EMessageType;
  /** @nullable */
  senderId: string | null;
  /** @nullable */
  senderName: string | null;
  createdAt: string;
}
