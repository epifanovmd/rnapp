import { IApiService } from "@api";
import {
  IMessageSearchDto,
  ISendMessageBody,
  MessageDto,
  PollDto,
} from "@api/api-gen/data-contracts";
import { IMessengerSocketService } from "@socket/messenger";
import {
  CollectionHolder,
  CursorHolder,
  MutationHolder,
  MutationStatus,
} from "@store/holders";
import { MessageModel } from "@store/models";
import { action, makeAutoObservable, observable, runInAction } from "mobx";

import { IAuthStore } from "../auth/Auth.types";
import { IChatStore } from "../chat/ChatStore.types";
import { IMessageStore } from "./MessageStore.types";

const MESSAGES_LIMIT = 40;
const TYPING_TIMEOUT_MS = 3000;

@IMessageStore({ inSingleton: true })
export class MessageStore implements IMessageStore {
  public messagesHolder = new CursorHolder<MessageDto>({
    keyExtractor: m => m.id,
    limit: MESSAGES_LIMIT,
  });

  public pinnedHolder = new CollectionHolder<MessageDto>({
    keyExtractor: m => m.id,
  });

  public sendMutation = new MutationHolder<ISendMessageBody, MessageDto>();

  public currentChatId: string | null = null;
  public typingUsers: Map<string, { timer: ReturnType<typeof setTimeout> }> =
    observable.map();
  public replyToMessage: MessageDto | null = null;
  public editingMessage: MessageDto | null = null;
  public searchResults: IMessageSearchDto | null = null;
  public isSearching = false;
  public isDetachedFromBottom = false;

  private _unsubscribeChat: (() => void) | null = null;

  constructor(
    @IApiService() private _api: IApiService,
    @IAuthStore() private _authStore: IAuthStore,
    @IChatStore() private _chatStore: IChatStore,
    @IMessengerSocketService()
    private _messengerSocket: IMessengerSocketService,
  ) {
    makeAutoObservable(
      this,
      {
        typingUsers: observable,
        handleNewMessage: action,
        handleMessageUpdated: action,
        handleMessageDeleted: action,
        handleTyping: action,
        handleReaction: action,
        handlePinned: action,
        handleUnpinned: action,
        handleStatus: action,
        handlePollUpdated: action,
        navigateToMessage: action,
        returnToLatest: action,
        loadNewerMessages: action,
      },
      { autoBind: true },
    );
  }

  get messageModels(): MessageModel[] {
    return this.messagesHolder.items.map(m => new MessageModel(m));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  async openChat(chatId: string): Promise<void> {
    // Отписываемся от предыдущего чата если был
    this._unsubscribeChat?.();
    this._unsubscribeChat = null;

    this.currentChatId = chatId;
    this.messagesHolder.reset();
    this.pinnedHolder.reset();
    this.replyToMessage = null;
    this.editingMessage = null;
    this.isDetachedFromBottom = false;
    this.clearSearch();

    // Подписываемся на socket-события текущего чата
    this._unsubscribeChat = this._messengerSocket.subscribeChat(chatId, {
      onNewMessage: message => this.handleNewMessage(message),
      onMessageUpdated: message => this.handleMessageUpdated(message),
      onMessageDeleted: ({ messageId }) => this.handleMessageDeleted(messageId),
      onMessageReaction: data => this.handleReaction(data),
      onMessagePinned: message => this.handlePinned(message),
      onMessageUnpinned: ({ messageId }) => this.handleUnpinned(messageId),
      onMessageStatus: data => this.handleStatus(data),
      onTyping: ({ userId }) => this.handleTyping(userId),
      onChatUpdated: chat => this._chatStore.handleChatUpdated(chat),
      onMemberJoined: ({ chatId: cid, userId }) =>
        this._chatStore.handleMemberJoined(cid, userId),
      onMemberLeft: ({ chatId: cid, userId }) =>
        this._chatStore.handleMemberLeft(cid, userId),
      onSlowMode: ({ chatId: cid, seconds }) =>
        this._chatStore.handleSlowMode(cid, seconds),
      onMemberBanned: ({ chatId: cid, userId }) =>
        this._chatStore.handleMemberBanned(cid, userId),
      onMemberUnbanned: ({ chatId: cid, userId }) =>
        this._chatStore.handleMemberUnbanned(cid, userId),
      onPollVoted: poll => this.handlePollUpdated(poll),
      onPollClosed: poll => this.handlePollUpdated(poll),
    });

    await this._loadMessages(chatId);
  }

  closeChat(): void {
    this._unsubscribeChat?.();
    this._unsubscribeChat = null;

    this.currentChatId = null;
    this.messagesHolder.reset();
    this.pinnedHolder.reset();
    this.replyToMessage = null;
    this.editingMessage = null;
    this.isDetachedFromBottom = false;
    this.clearSearch();
    this._clearTypingTimeouts();
  }

  // ── Send ───────────────────────────────────────────────────────────

  async sendMessage(chatId: string, body: ISendMessageBody): Promise<boolean> {
    const result = await this.sendMutation.execute(body, async args => {
      const res = await this._api.sendMessage({ chatId }, args);

      if (res.data) {
        runInAction(() => {
          this.messagesHolder.prependItem(res.data!);
        });
      }

      return res;
    });

    if (result.data) {
      runInAction(() => {
        this.replyToMessage = null;
      });
    }

    return !result.error;
  }

  async loadMoreMessages(chatId: string): Promise<void> {
    const holder = this.messagesHolder;

    if (!holder.hasMore || holder.isLoadingMore) return;

    const cursor = holder.oldestCursor as string | null;

    holder.setLoadingOlder();

    try {
      const res = await this._api.getMessages({
        chatId,
        before: cursor ?? undefined,
        limit: MESSAGES_LIMIT,
      });

      runInAction(() => {
        if (res.data) {
          holder.appendItems(res.data.data, res.data.hasMore);
        } else {
          holder.appendItems([], false);
        }
      });
    } catch {
      runInAction(() => {
        holder.loadMoreStatus = MutationStatus.Error;
      });
    }
  }

  // ── Navigation ────────────────────────────────────────────────────

  async navigateToMessage(chatId: string, messageId: string): Promise<boolean> {
    if (this.messagesHolder.exists(messageId)) {
      return true;
    }

    try {
      const res = await this._api.getMessages({
        chatId,
        around: messageId,
        limit: MESSAGES_LIMIT,
      });

      if (!res.data || res.data.data.length === 0) return false;

      const found = res.data.data.some(m => m.id === messageId);

      if (!found) return false;

      const hasNewer = res.data!.hasNewer ?? false;

      runInAction(() => {
        this.messagesHolder.setItems(
          res.data!.data,
          res.data!.hasMore,
          hasNewer,
        );
        this.isDetachedFromBottom = hasNewer;
      });

      return true;
    } catch {
      return false;
    }
  }

  async loadNewerMessages(chatId: string): Promise<void> {
    const holder = this.messagesHolder;

    if (!holder.hasNewer || holder.isLoadingNewer) return;

    const cursor = holder.newestCursor as string | null;

    if (!cursor) return;

    holder.setLoadingNewer();

    try {
      const res = await this._api.getMessages({
        chatId,
        after: cursor,
        limit: MESSAGES_LIMIT,
      });

      runInAction(() => {
        if (res.data && res.data.data.length > 0) {
          holder.prependItems(res.data.data, res.data.hasNewer ?? false);
        } else {
          holder.prependItems([], false);
        }

        if (!holder.hasNewer) {
          this.isDetachedFromBottom = false;
        }
      });
    } catch {
      runInAction(() => {
        holder.loadNewerStatus = MutationStatus.Error;
      });
    }
  }

  async returnToLatest(chatId: string): Promise<void> {
    this.isDetachedFromBottom = false;
    this.messagesHolder.reset();
    await this._loadMessages(chatId);
  }

  // ── Reply / Edit state ─────────────────────────────────────────────

  setReplyTo(message: MessageDto | null): void {
    this.replyToMessage = message;
    this.editingMessage = null;
  }

  setEditing(message: MessageDto | null): void {
    this.editingMessage = message;
    this.replyToMessage = null;
  }

  // ── Reactions ──────────────────────────────────────────────────────

  async addReaction(messageId: string, emoji: string): Promise<void> {
    await this._api.addReaction({ id: messageId }, { emoji });
  }

  async removeReaction(messageId: string): Promise<void> {
    await this._api.removeReaction({ id: messageId });
  }

  // ── Edit / Delete ──────────────────────────────────────────────────

  async editMessage(messageId: string, content: string): Promise<boolean> {
    try {
      const res = await this._api.editMessage({ id: messageId }, { content });

      if (res.data) {
        this.handleMessageUpdated(res.data);
        this.editingMessage = null;

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this._api.deleteMessage({ id: messageId });
    this.handleMessageDeleted(messageId);
  }

  // ── Pins ───────────────────────────────────────────────────────────

  async pinMessage(messageId: string): Promise<void> {
    const res = await this._api.pinMessage({ id: messageId });

    if (res.data) {
      this.handleMessageUpdated(res.data);
      this.pinnedHolder.appendItem(res.data);
    }
  }

  async unpinMessage(messageId: string): Promise<void> {
    await this._api.unpinMessage({ id: messageId });
    this.pinnedHolder.removeItem(m => m.id === messageId);

    const msg = this.messagesHolder.items.find(m => m.id === messageId);

    if (msg) {
      this.handleMessageUpdated({
        ...msg,
        isPinned: false,
        pinnedAt: null,
        pinnedById: null,
      });
    }
  }

  async loadPinnedMessages(chatId: string): Promise<void> {
    await this.pinnedHolder.fromApi(() =>
      this._api.getPinnedMessages({ chatId }),
    );
  }

  // ── Search ─────────────────────────────────────────────────────────

  async searchMessages(chatId: string, query: string): Promise<void> {
    if (!query.trim()) {
      this.clearSearch();

      return;
    }

    this.isSearching = true;

    try {
      const res = await this._api.searchMessages({
        chatId,
        q: query,
        limit: 50,
      });

      if (res.data) {
        this.searchResults = res.data;
      }
    } finally {
      this.isSearching = false;
    }
  }

  async searchGlobalMessages(query: string) {
    return this._api.searchMessages2({ q: query, limit: 50 });
  }

  clearSearch(): void {
    this.searchResults = null;
    this.isSearching = false;
  }

  // ── Media ──────────────────────────────────────────────────────────

  async getChatMedia(chatId: string, type?: string, offset = 0, limit = 50) {
    return this._api.getChatMedia({ chatId, type, offset, limit });
  }

  async getChatMediaStats(chatId: string) {
    return this._api.getChatMediaStats({ chatId });
  }

  // ── Mark as read / opened ──────────────────────────────────────────

  async markAsRead(chatId: string, messageId: string) {
    return this._api.markAsRead({ chatId }, { messageId });
  }

  // ── Forward ────────────────────────────────────────────────────────

  async forwardMessage(
    _fromChatId: string,
    messageId: string,
    toChatId: string,
  ): Promise<void> {
    await this._api.sendMessage(
      { chatId: toChatId },
      { forwardedFromId: messageId },
    );
  }

  // ── Socket event handlers ──────────────────────────────────────────

  handleNewMessage(message: MessageDto): void {
    console.log("message", message);
    if (message.chatId !== this.currentChatId) return;
    // Don't inject new messages while viewing older history
    if (this.isDetachedFromBottom) return;

    const exists = this.messagesHolder.exists(message.id);

    if (exists) return;

    this.messagesHolder.prependItem(message);
  }

  handleMessageUpdated(message: MessageDto): void {
    if (message.chatId === this.currentChatId) {
      this.messagesHolder.updateItem(message.id, message);
    }
  }

  handleMessageDeleted(messageId: string): void {
    this.messagesHolder.removeItem(m => m.id === messageId);
  }

  handleTyping(userId: string): void {
    const existing = this.typingUsers.get(userId);

    if (existing) {
      // User already marked as typing — just reset the timeout,
      // don't call .set() to avoid triggering MobX observers (prevents flicker)
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => {
        this.typingUsers.delete(userId);
      }, TYPING_TIMEOUT_MS);
    } else {
      // New typing user — add to Map (triggers observers once)
      const entry = {
        timer: setTimeout(() => {
          this.typingUsers.delete(userId);
        }, TYPING_TIMEOUT_MS),
      };

      this.typingUsers.set(userId, entry);
    }
  }

  handleReaction(data: {
    messageId: string;
    userId: string;
    emoji: string | null;
  }): void {
    const msg = this.messagesHolder.get(data.messageId);

    if (!msg) return;

    let reactions = [...msg.reactions];

    // 1. Remove user from ALL existing reactions (user can have only one reaction)
    reactions = reactions
      .map(r => ({
        ...r,
        userIds: r.userIds.filter(id => id !== data.userId),
        count: r.userIds.filter(id => id !== data.userId).length,
      }))
      .filter(r => r.count > 0);

    // 2. Add new reaction if not null (null = just remove)
    if (data.emoji !== null) {
      const existing = reactions.find(r => r.emoji === data.emoji);

      if (existing) {
        existing.userIds = [...existing.userIds, data.userId];
        existing.count = existing.userIds.length;
      } else {
        reactions.push({
          emoji: data.emoji,
          userIds: [data.userId],
          count: 1,
        });
      }
    }

    this.handleMessageUpdated({ ...msg, reactions });
  }

  handlePinned(message: MessageDto): void {
    this.handleMessageUpdated(message);
    const exists = this.pinnedHolder.exists(message.id);

    if (!exists) {
      this.pinnedHolder.appendItem(message);
    }
  }

  handleUnpinned(messageId: string): void {
    this.pinnedHolder.removeItem(messageId);

    const msg = this.messagesHolder.get(messageId);

    if (msg) {
      this.handleMessageUpdated({
        ...msg,
        isPinned: false,
        pinnedAt: null,
        pinnedById: null,
      });
    }
  }

  handleStatus(data: { messageId: string; status: string }): void {
    const msg = this.messagesHolder.get(m => m.id === data.messageId);

    if (msg) {
      this.handleMessageUpdated({
        ...msg,
        status: data.status as MessageDto["status"],
      });
    }
  }

  handlePollUpdated(poll: PollDto): void {
    const msg = this.messagesHolder.get(m => m.id === poll.messageId);

    if (msg) {
      this.handleMessageUpdated({ ...msg, poll });
    }
  }

  // ── Private ────────────────────────────────────────────────────────

  private async _loadMessages(chatId: string): Promise<void> {
    this.messagesHolder.setLoading();

    try {
      const res = await this._api.getMessages({
        chatId,
        limit: MESSAGES_LIMIT,
      });

      runInAction(() => {
        if (res.data) {
          this.messagesHolder.setItems(res.data.data, res.data.hasMore);
        } else {
          this.messagesHolder.setItems([], false);
        }
      });
    } catch {
      runInAction(() => {
        this.messagesHolder.setItems([], false);
      });
    }
  }

  private _clearTypingTimeouts(): void {
    this.typingUsers.forEach(entry => clearTimeout(entry.timer));
    this.typingUsers.clear();
  }
}
