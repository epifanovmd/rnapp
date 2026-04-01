import type {
  CallDto,
  ChatDto,
  ContactDto,
  MessageDto,
  NotificationSettingsDto,
  PollDto,
  PrivacySettingsDto,
  PublicProfileDto,
  SessionDto,
} from "@api/api-gen/data-contracts";

import type {
  ISocketAuth2faChangedPayload,
  ISocketAuthenticatedPayload,
  ISocketAuthErrorPayload,
  ISocketCallEndedPayload,
  ISocketCallHangupPayload,
  ISocketCallIceCandidatePayload,
  ISocketCallIceCandidateRelayPayload,
  ISocketCallRelayPayload,
  ISocketCallSignalPayload,
  ISocketChatLastMessagePayload,
  ISocketChatMemberBannedPayload,
  ISocketChatMemberJoinedPayload,
  ISocketChatMemberPayload,
  ISocketChatMemberRoleChangedPayload,
  ISocketChatPinnedPayload,
  ISocketChatRoomPayload,
  ISocketChatSlowModePayload,
  ISocketChatTypingPayload,
  ISocketChatUnreadPayload,
  ISocketContactRemovedPayload,
  ISocketMessageDeliveredPayload,
  ISocketMessageIdentifierPayload,
  ISocketMessageReactionPayload,
  ISocketMessageReadPayload,
  ISocketMessageStatusPayload,
  ISocketPresenceInitPayload,
  ISocketSessionPayload,
  ISocketSyncAvailablePayload,
  ISocketUserEmailVerifiedPayload,
  ISocketUserPasswordChangedPayload,
  ISocketUserPresencePayload,
  ISocketUserPrivilegesChangedPayload,
  ISocketUserUsernameChangedPayload,
} from "./types";

// ── Server → Client Events ──────────────────────────────────────────

export interface MessengerSocketServerEvents {
  // Heartbeat
  pong: (data: { ts: number }) => void;

  // Auth
  authenticated: (data: ISocketAuthenticatedPayload) => void;
  auth_error: (data: ISocketAuthErrorPayload) => void;

  // Profile
  "profile:updated": (data: PublicProfileDto) => void;

  // Messages
  "message:new": (data: MessageDto) => void;
  "message:updated": (data: MessageDto) => void;
  "message:deleted": (data: ISocketMessageIdentifierPayload) => void;
  "message:reaction": (data: ISocketMessageReactionPayload) => void;
  "message:pinned": (data: MessageDto) => void;
  "message:unpinned": (data: ISocketMessageIdentifierPayload) => void;
  "message:status": (data: ISocketMessageStatusPayload) => void;

  // Chat
  "chat:created": (data: ChatDto) => void;
  "chat:updated": (data: ChatDto) => void;
  "chat:typing": (data: ISocketChatTypingPayload) => void;
  "chat:unread": (data: ISocketChatUnreadPayload) => void;
  "chat:member:joined": (data: ISocketChatMemberJoinedPayload) => void;
  "chat:member:left": (data: ISocketChatMemberPayload) => void;
  "chat:pinned": (data: ISocketChatPinnedPayload) => void;
  "chat:slow-mode": (data: ISocketChatSlowModePayload) => void;
  "chat:member:banned": (data: ISocketChatMemberBannedPayload) => void;
  "chat:member:unbanned": (data: ISocketChatMemberPayload) => void;
  "chat:member:role-changed": (
    data: ISocketChatMemberRoleChangedPayload,
  ) => void;
  "chat:last-message": (data: ISocketChatLastMessagePayload) => void;

  // Polls
  "poll:voted": (data: PollDto) => void;
  "poll:closed": (data: PollDto) => void;

  // Calls
  "call:incoming": (data: CallDto) => void;
  "call:answered": (data: CallDto) => void;
  "call:declined": (data: CallDto) => void;
  "call:ended": (data: CallDto | ISocketCallEndedPayload) => void;
  "call:missed": (data: CallDto) => void;
  "call:offer": (data: ISocketCallRelayPayload) => void;
  "call:answer": (data: ISocketCallRelayPayload) => void;
  "call:ice-candidate": (data: ISocketCallIceCandidateRelayPayload) => void;

  // Sync
  "sync:available": (data: ISocketSyncAvailablePayload) => void;

  // Contacts
  "contact:request": (data: ContactDto) => void;
  "contact:accepted": (data: ContactDto) => void;
  "contact:removed": (data: ISocketContactRemovedPayload) => void;
  "contact:blocked": (data: ContactDto) => void;
  "contact:unblocked": (data: ContactDto) => void;

  // Presence
  "user:online": (data: ISocketUserPresencePayload) => void;
  "user:offline": (data: ISocketUserPresencePayload) => void;
  "presence:init": (data: ISocketPresenceInitPayload) => void;

  // User
  "user:email-verified": (data: ISocketUserEmailVerifiedPayload) => void;
  "user:password-changed": (data: ISocketUserPasswordChangedPayload) => void;
  "user:privileges-changed": (
    data: ISocketUserPrivilegesChangedPayload,
  ) => void;
  "user:username-changed": (data: ISocketUserUsernameChangedPayload) => void;

  // Sessions
  "session:new": (data: SessionDto) => void;
  "session:terminated": (data: ISocketSessionPayload) => void;

  // Auth
  "auth:2fa-changed": (data: ISocketAuth2faChangedPayload) => void;

  // Profile privacy
  "profile:privacy-changed": (data: PrivacySettingsDto) => void;

  // Push
  "push:settings-changed": (data: NotificationSettingsDto) => void;
}

// ── Client → Server Events ──────────────────────────────────────────

export interface MessengerSocketClientEvents {
  // Heartbeat
  ping: (data: { ts: number }) => void;

  // Profile
  "profile:subscribe": () => void;

  // Chat
  "chat:join": (data: ISocketChatRoomPayload) => void;
  "chat:leave": (data: ISocketChatRoomPayload) => void;
  "chat:typing": (data: ISocketChatRoomPayload) => void;

  // Messages
  "message:read": (data: ISocketMessageReadPayload) => void;
  "message:delivered": (data: ISocketMessageDeliveredPayload) => void;

  // Calls (WebRTC signaling)
  "call:offer": (data: ISocketCallSignalPayload) => void;
  "call:answer": (data: ISocketCallSignalPayload) => void;
  "call:ice-candidate": (data: ISocketCallIceCandidatePayload) => void;
  "call:hangup": (data: ISocketCallHangupPayload) => void;
}
