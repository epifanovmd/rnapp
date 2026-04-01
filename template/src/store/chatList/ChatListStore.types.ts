import {
  ChatDto,
  ChatLastMessageDto,
  ICreateChannelBody,
  MessageDto,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { PagedHolder } from "@store/holders";
import { ChatModel } from "@store/models";

export const IChatListStore = createServiceDecorator<IChatListStore>();

export interface IChatListStore {
  listHolder: PagedHolder<ChatDto>;
  models: ChatModel[];
  sortedChats: ChatDto[];
  filteredChats: ChatDto[];
  isLoading: boolean;
  searchQuery: string;
  activeFolderId: string | null;
  unreadCounts: Map<string, number>;

  load(): Promise<void>;
  createDirectChat(targetUserId: string): Promise<ChatDto | undefined>;
  createGroupChat(
    name: string,
    memberIds: string[],
    avatarId?: string,
  ): Promise<ChatDto | undefined>;
  createChannel(data: ICreateChannelBody): Promise<ChatDto | undefined>;
  setSearchQuery(query: string): void;
  setActiveFolder(folderId: string | null): void;

  togglePin(chatId: string): Promise<void>;
  toggleMute(chatId: string): Promise<void>;
  muteChat(chatId: string, mutedUntil: string | null): Promise<void>;
  pinChat(chatId: string): Promise<void>;
  unpinChat(chatId: string): Promise<void>;
  leaveChat(chatId: string): Promise<void>;
  moveChatToFolder(chatId: string, folderId: string | null): Promise<void>;
  markAsRead(chatId: string, messageId: string): Promise<void>;

  handleChatPinned(chatId: string, isPinned: boolean): void;
  handleNewMessage(message: MessageDto): void;
  handleChatCreated(chat: ChatDto): void;
  handleChatUpdated(chat: ChatDto): void;
  handleUnreadUpdate(chatId: string, count: number): void;
  handleLastMessageUpdated(
    chatId: string,
    lastMessage: ChatLastMessageDto | null,
  ): void;
  handleProfileUpdated(profile: PublicProfileDto): void;
}
