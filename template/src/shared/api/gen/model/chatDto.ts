import type { ChatLastMessageDto } from "./chatLastMessageDto";
import type { ChatMemberDto } from "./chatMemberDto";
import type { ChatPeerDto } from "./chatPeerDto";
import type { EChatType } from "./eChatType";

export interface ChatDto {
  id: string;
  type: EChatType;
  /** @nullable */
  name: string | null;
  /** @nullable */
  description: string | null;
  /** @nullable */
  username: string | null;
  isPublic: boolean;
  /** @nullable */
  avatarUrl: string | null;
  /** @nullable */
  createdById: string | null;
  slowModeSeconds: number;
  /** @nullable */
  lastMessageAt: string | null;
  lastMessage: ChatLastMessageDto | null;
  createdAt: string;
  updatedAt: string;
  members: ChatMemberDto[];
  /** Членство текущего пользователя в чате */
  me: ChatMemberDto | null;
  /** Собеседник в direct-чате (null для групп/каналов) */
  peer: ChatPeerDto | null;
}
