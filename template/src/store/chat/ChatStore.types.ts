import { ApiError } from "@api";
import {
  ChatDto,
  ChatInviteDto,
  ChatMemberDto,
  IBanMemberBody,
  IBannedMemberDto,
  IChatListDto,
  ICreateInviteBody,
  IUpdateChannelBody,
  IUpdateChatBody,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { EntityHolder } from "@store/holders";
import { ChatModel } from "@store/models";

export const IChatStore = createServiceDecorator<IChatStore>();

export interface IChatStore {
  readonly chatHolder: EntityHolder<ChatDto, string>;
  readonly currentChatId: string | null;
  readonly chat: ChatDto | null;
  readonly chatModel: ChatModel | null;
  readonly isLoading: boolean;

  openChat(chatId: string): Promise<void>;
  closeChat(): void;
  sendTyping(chatId: string): void;

  // Chat CRUD
  updateChat(
    chatId: string,
    data: IUpdateChatBody,
  ): Promise<ApiResponse<ChatDto, ApiError>>;
  leaveChat(chatId: string): Promise<ApiResponse<string, ApiError>>;

  // Channel operations
  updateChannel(
    channelId: string,
    data: IUpdateChannelBody,
  ): Promise<ApiResponse<ChatDto, ApiError>>;
  subscribeToChannel(
    channelId: string,
  ): Promise<ApiResponse<ChatDto, ApiError>>;
  unsubscribeFromChannel(
    channelId: string,
  ): Promise<ApiResponse<string, ApiError>>;
  searchChannels(query: string): Promise<ApiResponse<IChatListDto, ApiError>>;

  // Moderation
  setSlowMode(
    chatId: string,
    seconds: number,
  ): Promise<
    ApiResponse<{ slowModeSeconds: number; chatId: string }, ApiError>
  >;
  banMember(
    chatId: string,
    userId: string,
    data?: IBanMemberBody,
  ): Promise<ApiResponse<void, ApiError>>;
  unbanMember(
    chatId: string,
    userId: string,
  ): Promise<ApiResponse<void, ApiError>>;
  getBannedMembers(
    chatId: string,
  ): Promise<ApiResponse<IBannedMemberDto[], ApiError>>;

  // Members
  addMembers(
    chatId: string,
    memberIds: string[],
  ): Promise<ApiResponse<ChatMemberDto[], ApiError>>;
  removeMember(
    chatId: string,
    userId: string,
  ): Promise<ApiResponse<string, ApiError>>;
  updateMemberRole(
    chatId: string,
    userId: string,
    role: string,
  ): Promise<ApiResponse<ChatMemberDto, ApiError>>;

  // Invites
  createInviteLink(
    chatId: string,
    data?: ICreateInviteBody,
  ): Promise<ApiResponse<ChatInviteDto, ApiError>>;
  getInvites(chatId: string): Promise<ApiResponse<ChatInviteDto[], ApiError>>;
  revokeInvite(
    chatId: string,
    inviteId: string,
  ): Promise<ApiResponse<void, ApiError>>;
  joinByInvite(code: string): Promise<ApiResponse<ChatDto, ApiError>>;

  // Socket handlers
  handleChatUpdated(chat: ChatDto): void;
  handleMemberJoined(
    chatId: string,
    userId: string,
    member?: ChatMemberDto,
  ): void;
  handleMemberLeft(chatId: string, userId: string): void;
  handleMemberRoleChanged(chatId: string, userId: string, role: string): void;
  handleSlowMode(chatId: string, seconds: number): void;
  handleMemberBanned(chatId: string, userId: string): void;
  handleMemberUnbanned(chatId: string, userId: string): void;
  handleProfileUpdated(profile: PublicProfileDto): void;
}
