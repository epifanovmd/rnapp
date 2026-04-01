import { IApiService } from "@api";
import {
  ChatDto,
  ChatLastMessageDto,
  ICreateChannelBody,
  MessageDto,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { IAuthStore } from "@store/auth/Auth.types";
import { PagedHolder } from "@store/holders";
import { ChatModel, createModelMapper } from "@store/models";
import { action, computed, makeAutoObservable, observable } from "mobx";

import { updateChatProfile } from "../utils";
import { IChatListStore } from "./ChatListStore.types";

@IChatListStore({ inSingleton: true })
export class ChatListStore implements IChatListStore {
  public listHolder = new PagedHolder<ChatDto>({
    keyExtractor: c => c.id,
    pageSize: 50,
    onFetch: pagination => this._api.getUserChats(pagination),
  });

  public searchQuery = "";
  public activeFolderId: string | null = null;
  public unreadCounts: Map<string, number> = observable.map();

  private _toModels = createModelMapper<ChatDto, ChatModel>(
    c => c.id,
    c => new ChatModel(c),
  );

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthStore() private _authStore: IAuthStore,
  ) {
    makeAutoObservable(
      this,
      {
        unreadCounts: observable,
        sortedChats: computed,
        filteredChats: computed,
        handleNewMessage: action,
        handleChatCreated: action,
        handleChatUpdated: action,
        handleUnreadUpdate: action,
        handleLastMessageUpdated: action,
        handleProfileUpdated: action,
      },
      { autoBind: true },
    );
  }

  // ── Computed ───────────────────────────────────────────────────────────

  get models() {
    return this._toModels(this.listHolder.items);
  }

  get isLoading() {
    return this.listHolder.isLoading;
  }

  /** Chats sorted: pinned first, then by lastMessageAt desc */
  get sortedChats() {
    return [...this.listHolder.items].sort((a, b) => {
      const aPinned = this._isPinned(a);
      const bPinned = this._isPinned(b);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;

      return bTime - aTime;
    });
  }

  /** Sorted chats with folder + search filters applied */
  get filteredChats(): ChatDto[] {
    let chats = this.sortedChats;

    if (this.activeFolderId) {
      chats = chats.filter(c => c.me?.folderId === this.activeFolderId);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();

      chats = chats.filter(c => {
        const name = c.name?.toLowerCase() ?? "";
        const memberNames = c.members
          .map(m =>
            [m.profile?.firstName, m.profile?.lastName]
              .filter(Boolean)
              .join(" ")
              .toLowerCase(),
          )
          .join(" ");

        return name.includes(q) || memberNames.includes(q);
      });
    }

    return chats;
  }

  // ── Data loading ───────────────────────────────────────────────────────

  async load() {
    await this.listHolder.load();
  }

  // ── Chat creation ──────────────────────────────────────────────────────

  async createDirectChat(targetUserId: string) {
    const res = await this._api.createDirectChat({ targetUserId });

    if (res.data) {
      this.handleChatCreated(res.data);
    }

    return res.data;
  }

  async createGroupChat(name: string, memberIds: string[], avatarId?: string) {
    const res = await this._api.createGroupChat({ name, memberIds, avatarId });

    if (res.data) {
      this.handleChatCreated(res.data);
    }

    return res.data;
  }

  async createChannel(data: ICreateChannelBody) {
    const res = await this._api.createChannel(data);

    if (res.data) {
      this.handleChatCreated(res.data);
    }

    return res.data;
  }

  // ── Filters ────────────────────────────────────────────────────────────

  setSearchQuery(query: string): void {
    this.searchQuery = query;
  }

  setActiveFolder(folderId: string | null): void {
    this.activeFolderId = folderId;
  }

  // ── Chat organization (optimistic) ────────────────────────────────────

  async togglePin(chatId: string): Promise<void> {
    const chat = this.listHolder.items.find(c => c.id === chatId);

    if (chat?.me?.isPinnedChat) {
      await this.unpinChat(chatId);
    } else {
      await this.pinChat(chatId);
    }
  }

  async toggleMute(chatId: string): Promise<void> {
    const chat = this.listHolder.items.find(c => c.id === chatId);
    const isMuted = chat?.me?.mutedUntil
      ? new Date(chat.me.mutedUntil) > new Date()
      : false;

    if (isMuted) {
      await this.muteChat(chatId, null);
    } else {
      const until = new Date();

      until.setFullYear(until.getFullYear() + 1);
      await this.muteChat(chatId, until.toISOString());
    }
  }

  async muteChat(chatId: string, mutedUntil: string | null): Promise<void> {
    // Optimistic update
    this._updateMyMember(chatId, m => ({ ...m, mutedUntil }));

    const res = await this._api.muteChat({ id: chatId }, { mutedUntil });

    if (res.error) {
      // Rollback on failure
      await this.listHolder.reload({ refresh: true });
    }
  }

  async pinChat(chatId: string): Promise<void> {
    this._updateMyMember(chatId, m => ({
      ...m,
      isPinnedChat: true,
      pinnedChatAt: new Date().toISOString(),
    }));

    const res = await this._api.pinChat({ id: chatId });

    if (res.error) {
      await this.listHolder.reload({ refresh: true });
    }
  }

  async unpinChat(chatId: string): Promise<void> {
    this._updateMyMember(chatId, m => ({
      ...m,
      isPinnedChat: false,
      pinnedChatAt: null,
    }));

    const res = await this._api.unpinChat({ id: chatId });

    if (res.error) {
      await this.listHolder.reload({ refresh: true });
    }
  }

  async leaveChat(chatId: string): Promise<void> {
    this.listHolder.removeItem(chatId);

    const res = await this._api.leaveChat({ id: chatId });

    if (res.error) {
      await this.listHolder.reload({ refresh: true });
    }
  }

  async moveChatToFolder(
    chatId: string,
    folderId: string | null,
  ): Promise<void> {
    // Optimistic: update member's folderId
    this._updateMyMember(chatId, m => ({ ...m, folderId }));

    const res = await this._api.moveChatToFolder({ id: chatId }, { folderId });

    if (res.error) {
      await this.listHolder.reload({ refresh: true });
    }
  }

  async markAsRead(chatId: string, messageId: string): Promise<void> {
    this.unreadCounts.set(chatId, 0);
    await this._api.markAsRead({ chatId }, { messageId });
  }

  // ── Socket handlers ────────────────────────────────────────────────────

  handleNewMessage(message: MessageDto): void {
    const chatId = message.chatId;
    const chat = this.listHolder.get(c => c.id === chatId);

    if (!chat) return;

    const lastMessage: ChatLastMessageDto = {
      id: message.id,
      content: message.content ?? null,
      type: message.type,
      senderId: message.senderId ?? null,
      senderName: message.sender
        ? [message.sender.firstName, message.sender.lastName]
            .filter(Boolean)
            .join(" ") || null
        : null,
      createdAt: message.createdAt,
    };

    this.listHolder.updateItem(chatId, {
      ...chat,
      lastMessage,
      lastMessageAt: message.createdAt,
    });
  }

  handleChatCreated(chat: ChatDto): void {
    this.listHolder.prependIfNotExists(chat.id, chat);
  }

  handleChatUpdated(chat: ChatDto): void {
    this.listHolder.updateItem(chat.id, chat);
  }

  handleUnreadUpdate(chatId: string, count: number): void {
    this.unreadCounts.set(chatId, count);
  }

  handleLastMessageUpdated(
    chatId: string,
    lastMessage: ChatLastMessageDto | null,
  ): void {
    const chat = this.listHolder.items.find(c => c.id === chatId);

    if (!chat) return;

    this.listHolder.updateItem(chatId, {
      ...chat,
      lastMessage,
      lastMessageAt: lastMessage?.createdAt ?? chat.lastMessageAt,
    });
  }

  handleChatPinned(chatId: string, isPinned: boolean): void {
    this._updateMyMember(chatId, m => ({
      ...m,
      isPinnedChat: isPinned,
      pinnedChatAt: isPinned ? new Date().toISOString() : null,
    }));
  }

  handleProfileUpdated(profile: PublicProfileDto): void {
    for (const chat of this.listHolder.items) {
      const updated = updateChatProfile(chat, profile);

      if (updated) {
        this.listHolder.updateItem(chat.id, updated);
      }
    }
  }

  // ── Private ────────────────────────────────────────────────────────────

  private _isPinned(chat: ChatDto): boolean {
    return chat.me?.isPinnedChat ?? false;
  }

  /** Optimistically update the current user's membership inside a chat. */
  private _updateMyMember(
    chatId: string,
    updater: (member: ChatDto["members"][0]) => ChatDto["members"][0],
  ): void {
    const chat = this.listHolder.items.find(c => c.id === chatId);

    if (!chat || !chat.me) return;

    const updated = updater(chat.me);

    this.listHolder.updateItem(chatId, {
      ...chat,
      me: updated,
      members: chat.members.map(m =>
        m.userId === updated.userId ? updated : m,
      ),
    });
  }
}
