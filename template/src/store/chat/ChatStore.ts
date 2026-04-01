import { IApiService } from "@api";
import {
  ChatDto,
  ChatMemberDto,
  IBanMemberBody,
  ICreateInviteBody,
  IUpdateChannelBody,
  IUpdateChatBody,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { ISocketTransport } from "@socket";
import { EntityHolder } from "@store/holders";
import { ChatModel } from "@store/models";
import { action, makeAutoObservable } from "mobx";

import { updateChatProfile } from "../utils";
import { IChatStore } from "./ChatStore.types";

@IChatStore({ inSingleton: true })
export class ChatStore implements IChatStore {
  public chatHolder = new EntityHolder<ChatDto, string>({
    onFetch: id => this._api.getChatById({ id }),
  });

  public currentChatId: string | null = null;

  private _roomDisposers: Array<() => void> = [];

  constructor(
    @IApiService() private _api: IApiService,
    @ISocketTransport() private _socketTransport: ISocketTransport,
  ) {
    makeAutoObservable(
      this,
      {
        handleChatUpdated: action,
        handleMemberJoined: action,
        handleMemberLeft: action,
        handleMemberRoleChanged: action,
        handleSlowMode: action,
        handleMemberBanned: action,
        handleMemberUnbanned: action,
        handleProfileUpdated: action,
      },
      { autoBind: true },
    );
  }

  get chat(): ChatDto | null {
    return this.chatHolder.data;
  }

  get chatModel(): ChatModel | null {
    return this.chatHolder.data ? new ChatModel(this.chatHolder.data) : null;
  }

  get isLoading(): boolean {
    return this.chatHolder.isLoading;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  async openChat(chatId: string): Promise<void> {
    this.currentChatId = chatId;
    this._subscribeToChatRoom(chatId);
    await this.chatHolder.load(chatId);
  }

  closeChat(): void {
    this._unsubscribeFromChatRoom();
    this.currentChatId = null;
    this.chatHolder.reset();
  }

  sendTyping(chatId: string): void {
    this._socketTransport.emit("chat:typing", { chatId });
  }

  // ── Chat CRUD ─────────────────────────────────────────────────────

  async updateChat(chatId: string, data: IUpdateChatBody) {
    const res = await this._api.updateChat({ id: chatId }, data);

    if (res.data) {
      this.chatHolder.setData(res.data);
    }

    return res;
  }

  async leaveChat(chatId: string) {
    return this._api.leaveChat({ id: chatId });
  }

  // ── Channel operations ─────────────────────────────────────────────

  async updateChannel(channelId: string, data: IUpdateChannelBody) {
    return this._api.updateChannel({ id: channelId }, data);
  }

  async subscribeToChannel(channelId: string) {
    return this._api.subscribeToChannel({ id: channelId });
  }

  async unsubscribeFromChannel(channelId: string) {
    return this._api.unsubscribeFromChannel({ id: channelId });
  }

  async searchChannels(query: string) {
    return this._api.searchChannels({ q: query });
  }

  // ── Moderation ────────────────────────────────────────────────────

  async setSlowMode(chatId: string, seconds: number) {
    return this._api.setSlowMode({ id: chatId }, { seconds });
  }

  async banMember(chatId: string, userId: string, data?: IBanMemberBody) {
    return this._api.banMember({ id: chatId, userId }, data ?? {});
  }

  async unbanMember(chatId: string, userId: string) {
    return this._api.unbanMember({ id: chatId, userId });
  }

  async getBannedMembers(chatId: string) {
    return this._api.getBannedMembers({ id: chatId });
  }

  // ── Members ───────────────────────────────────────────────────────

  async addMembers(chatId: string, memberIds: string[]) {
    return this._api.addMembers({ id: chatId }, { memberIds });
  }

  async removeMember(chatId: string, userId: string) {
    return this._api.removeMember({ id: chatId, userId });
  }

  async updateMemberRole(chatId: string, userId: string, role: string) {
    return this._api.updateMemberRole(
      { id: chatId, userId },
      {
        role: role as Parameters<typeof this._api.updateMemberRole>[1]["role"],
      },
    );
  }

  // ── Invites ───────────────────────────────────────────────────────

  async createInviteLink(chatId: string, data?: ICreateInviteBody) {
    return this._api.createInviteLink({ id: chatId }, data ?? {});
  }

  async getInvites(chatId: string) {
    return this._api.getInvites({ id: chatId });
  }

  async revokeInvite(chatId: string, inviteId: string) {
    return this._api.revokeInvite({ id: chatId, inviteId });
  }

  async joinByInvite(code: string) {
    return this._api.joinByInvite({ code });
  }

  // ── Socket handlers ───────────────────────────────────────────────

  handleChatUpdated(chat: ChatDto): void {
    if (this.currentChatId === chat.id) {
      this.chatHolder.setData(chat);
    }
  }

  handleMemberJoined(
    chatId: string,
    _userId: string,
    member?: ChatMemberDto,
  ): void {
    const chat = this.chatHolder.data;

    if (chat && chat.id === chatId && member) {
      const exists = chat.members.some(m => m.userId === member.userId);

      if (!exists) {
        this.chatHolder.setData({
          ...chat,
          members: [...chat.members, member],
        });
      }
    } else if (this.currentChatId === chatId) {
      this.chatHolder.refresh(chatId);
    }
  }

  handleMemberLeft(chatId: string, _userId: string): void {
    if (this.currentChatId === chatId) {
      this.chatHolder.refresh(chatId);
    }
  }

  handleMemberRoleChanged(
    chatId: string,
    _userId: string,
    _role: string,
  ): void {
    if (this.currentChatId === chatId) {
      this.chatHolder.refresh(chatId);
    }
  }

  handleSlowMode(chatId: string, seconds: number): void {
    const chat = this.chatHolder.data;

    if (chat && chat.id === chatId) {
      this.chatHolder.setData({ ...chat, slowModeSeconds: seconds });
    }
  }

  handleMemberBanned(chatId: string, _userId: string): void {
    if (this.currentChatId === chatId) {
      this.chatHolder.refresh(chatId);
    }
  }

  handleMemberUnbanned(chatId: string, _userId: string): void {
    if (this.currentChatId === chatId) {
      this.chatHolder.refresh(chatId);
    }
  }

  handleProfileUpdated(profile: PublicProfileDto): void {
    const chat = this.chatHolder.data;

    if (!chat) return;

    const updated = updateChatProfile(chat, profile);

    if (updated) {
      this.chatHolder.setData(updated);
    }
  }

  // ── Room subscription ─────────────────────────────────────────────

  private _subscribeToChatRoom(chatId: string): void {
    this._unsubscribeFromChatRoom();

    this._socketTransport.emit("chat:join", { chatId });

    this._roomDisposers.push(
      this._socketTransport.onConnect(() => {
        this._socketTransport.emit("chat:join", { chatId });
      }),
      this._socketTransport.on("chat:updated", chat => {
        this.handleChatUpdated(chat);
      }),
      this._socketTransport.on(
        "chat:member:joined",
        ({ chatId: cId, userId, member }) => {
          this.handleMemberJoined(cId, userId, member);
        },
      ),
      this._socketTransport.on(
        "chat:member:left",
        ({ chatId: cId, userId }) => {
          this.handleMemberLeft(cId, userId);
        },
      ),
      this._socketTransport.on(
        "chat:member:role-changed",
        ({ chatId: cId, userId, role }) => {
          this.handleMemberRoleChanged(cId, userId, role);
        },
      ),
      this._socketTransport.on("chat:slow-mode", ({ chatId: cId, seconds }) => {
        this.handleSlowMode(cId, seconds);
      }),
      this._socketTransport.on(
        "chat:member:banned",
        ({ chatId: cId, userId }) => {
          this.handleMemberBanned(cId, userId);
        },
      ),
      this._socketTransport.on(
        "chat:member:unbanned",
        ({ chatId: cId, userId }) => {
          this.handleMemberUnbanned(cId, userId);
        },
      ),
    );
  }

  private _unsubscribeFromChatRoom(): void {
    if (this.currentChatId) {
      this._socketTransport.emit("chat:leave", { chatId: this.currentChatId });
    }
    this._roomDisposers.forEach(d => d());
    this._roomDisposers = [];
  }
}
