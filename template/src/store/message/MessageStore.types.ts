import { ApiError } from "@api/Api.types";
import {
  IMediaGalleryDto,
  IMediaStatsDto,
  IMessageSearchDto,
  ISendMessageBody,
  MessageDto,
  PollDto,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { CollectionHolder, CursorHolder, MutationHolder } from "@store/holders";
import { MessageModel } from "@store/models";

export const IMessageStore = createServiceDecorator<IMessageStore>();

export interface IMessageStore {
  readonly messagesHolder: CursorHolder<MessageDto>;
  readonly pinnedHolder: CollectionHolder<MessageDto>;
  readonly sendMutation: MutationHolder<ISendMessageBody, MessageDto>;
  readonly messageModels: MessageModel[];
  readonly typingUsers: Map<string, { timer: ReturnType<typeof setTimeout> }>;
  readonly replyToMessage: MessageDto | null;
  readonly editingMessage: MessageDto | null;
  readonly searchResults: IMessageSearchDto | null;
  readonly isSearching: boolean;
  readonly currentChatId: string | null;
  /** True when viewing messages around a specific message (not at the latest). */
  readonly isDetachedFromBottom: boolean;

  openChat(chatId: string): Promise<void>;
  closeChat(): void;

  // Send
  sendMessage(chatId: string, body: ISendMessageBody): Promise<boolean>;
  loadMoreMessages(chatId: string): Promise<void>;

  // Navigation
  /** Load messages around a specific message and jump to it. */
  navigateToMessage(chatId: string, messageId: string): Promise<boolean>;
  /** Load newer messages when scrolling down from a detached window. */
  loadNewerMessages(chatId: string): Promise<void>;
  /** Return to the latest messages after navigateToMessage. */
  returnToLatest(chatId: string): Promise<void>;

  // Reply / Edit state
  setReplyTo(message: MessageDto | null): void;
  setEditing(message: MessageDto | null): void;

  // Reactions
  addReaction(messageId: string, emoji: string): Promise<void>;
  removeReaction(messageId: string): Promise<void>;

  // Edit / Delete
  editMessage(messageId: string, content: string): Promise<boolean>;
  deleteMessage(messageId: string): Promise<void>;

  // Pins
  pinMessage(messageId: string): Promise<void>;
  unpinMessage(messageId: string): Promise<void>;
  loadPinnedMessages(chatId: string): Promise<void>;

  // Search
  searchMessages(chatId: string, query: string): Promise<void>;
  searchGlobalMessages(
    query: string,
  ): Promise<ApiResponse<IMessageSearchDto, ApiError>>;
  clearSearch(): void;

  // Media
  getChatMedia(
    chatId: string,
    type?: string,
    offset?: number,
    limit?: number,
  ): Promise<ApiResponse<IMediaGalleryDto, ApiError>>;
  getChatMediaStats(
    chatId: string,
  ): Promise<ApiResponse<IMediaStatsDto, ApiError>>;

  // Mark as read
  markAsRead(
    chatId: string,
    messageId: string,
  ): Promise<ApiResponse<void, ApiError>>;

  // Forward
  forwardMessage(
    fromChatId: string,
    messageId: string,
    toChatId: string,
  ): Promise<void>;

  // Socket handlers
  handleNewMessage(message: MessageDto): void;
  handleMessageUpdated(message: MessageDto): void;
  handleMessageDeleted(messageId: string): void;
  handleTyping(userId: string): void;
  handleReaction(data: {
    messageId: string;
    userId: string;
    emoji: string | null;
  }): void;
  handlePinned(message: MessageDto): void;
  handleUnpinned(messageId: string): void;
  handleStatus(data: { messageId: string; status: string }): void;
  handlePollUpdated(poll: PollDto): void;
}
