import { MessageDto, PublicUserDto } from "@api/api-gen/data-contracts";

// ---------------------------------------------------------------------------
// Server -> Client events
// ---------------------------------------------------------------------------

export interface SocketServerToClientEvents {
  authenticated: (data: { userId: string }) => void;
  auth_error: (data: { message: string }) => void;

  // Chat messages
  message: (message: MessageDto) => void;
  messageRead: (data: { messageId: string; chatId: string }) => void;
  deleteMessage: (chatId: string, messageId: string) => void;

  // Chat lifecycle
  newChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;

  // Presence
  online: (data: { userId: string; isOnline: boolean }) => void;
  checkOnline: (isOnline: boolean) => void;
  typing: (data: { user: PublicUserDto; isTyping: boolean }) => void;
}

// ---------------------------------------------------------------------------
// Client -> Server events
// ---------------------------------------------------------------------------

export interface SocketClientToServerEvents {
  messageRead: (messageId: string, chatId: string) => void;
  online: (isOnline: boolean) => void;
  checkOnline: (userId: string, callback: (isOnline: boolean) => void) => void;
  typing: (chatId: string) => void;
  join_chat: (chatId: string) => void;
  leave_chat: (chatId: string) => void;
}
