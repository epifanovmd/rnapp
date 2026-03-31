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
import { ChatModel } from "@store/models";
import { action, computed, makeAutoObservable, observable } from "mobx";

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

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthStore() private _authStore: IAuthStore,
  ) {
    makeAutoObservable(
      this,
      {
        unreadCounts: observable,
        sortedChats: computed,
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
    return this.listHolder.items.map(c => new ChatModel(c));
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
    // Avoid duplicates
    const exists = this.listHolder.exists(c => c.id === chat.id);

    if (!exists) {
      this.listHolder.prependItem(chat);
    }
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

  handleProfileUpdated(profile: PublicProfileDto): void {
    for (const chat of this.listHolder.items) {
      // Обновляем профиль в peer (direct-чаты)
      if (chat.peer?.userId === profile.userId && chat.peer.profile) {
        this.listHolder.updateItem(chat.id, {
          ...chat,
          peer: { ...chat.peer, profile: { ...chat.peer.profile, ...profile } },
        });
        continue;
      }

      // Обновляем профиль в members (группы/каналы)
      const memberIdx = chat.members.findIndex(
        m => m.profile?.userId === profile.userId,
      );

      if (memberIdx !== -1) {
        const member = chat.members[memberIdx];
        const updatedMembers = [...chat.members];

        updatedMembers[memberIdx] = {
          ...member,
          profile: { ...member.profile!, ...profile },
        };
        this.listHolder.updateItem(chat.id, {
          ...chat,
          members: updatedMembers,
        });
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
