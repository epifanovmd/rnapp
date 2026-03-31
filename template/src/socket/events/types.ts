import type {
  ChatLastMessageDto,
  ChatMemberDto,
} from "@api/api-gen/data-contracts";

// ─── Payload-интерфейсы: Клиент → Сервер ─────────────────────────────────

export interface ISocketChatRoomPayload {
  chatId: string;
}

export interface ISocketMessageReadPayload {
  chatId: string;
  messageId: string;
}

export interface ISocketMessageDeliveredPayload {
  chatId: string;
  messageIds: string[];
}

export interface ISocketCallSignalPayload {
  callId: string;
  targetUserId: string;
  sdp: unknown;
}

export interface ISocketCallIceCandidatePayload {
  callId: string;
  targetUserId: string;
  candidate: unknown;
}

export interface ISocketCallHangupPayload {
  callId: string;
  targetUserId: string;
}

// ─── Payload-интерфейсы: Сервер → Клиент ─────────────────────────────────

export interface ISocketAuthenticatedPayload {
  userId: string;
}

export interface ISocketAuthErrorPayload {
  message: string;
}

export interface ISocketMessageIdentifierPayload {
  messageId: string;
  chatId: string;
}

export interface ISocketMessageReactionPayload {
  messageId: string;
  chatId: string;
  userId: string;
  emoji: string | null;
}

export interface ISocketMessageStatusPayload {
  messageId: string;
  chatId: string;
  status: string;
}

export interface ISocketChatTypingPayload {
  chatId: string;
  userId: string;
}

export interface ISocketChatUnreadPayload {
  chatId: string;
  unreadCount: number;
}

export interface ISocketChatMemberJoinedPayload {
  chatId: string;
  userId: string;
  member?: ChatMemberDto;
}

export interface ISocketChatMemberPayload {
  chatId: string;
  userId: string;
}

export interface ISocketChatPinnedPayload {
  chatId: string;
  isPinned: boolean;
}

export interface ISocketChatSlowModePayload {
  chatId: string;
  seconds: number;
}

export interface ISocketChatMemberBannedPayload {
  chatId: string;
  userId: string;
  bannedBy: string;
  reason?: string;
}

export interface ISocketChatMemberRoleChangedPayload {
  chatId: string;
  userId: string;
  role: string;
}

export interface ISocketChatLastMessagePayload {
  chatId: string;
  lastMessage: ChatLastMessageDto | null;
}

export interface ISocketCallEndedPayload {
  callId: string;
  endedBy: string;
}

export interface ISocketCallRelayPayload {
  callId: string;
  fromUserId: string;
  sdp: unknown;
}

export interface ISocketCallIceCandidateRelayPayload {
  callId: string;
  fromUserId: string;
  candidate: unknown;
}

export interface ISocketSyncAvailablePayload {
  version: string;
}

export interface ISocketSessionPayload {
  sessionId: string;
}

export interface ISocketUserPresencePayload {
  userId: string;
  lastOnline?: string | null;
}

export interface ISocketPresenceInitPayload {
  onlineUserIds: string[];
}
