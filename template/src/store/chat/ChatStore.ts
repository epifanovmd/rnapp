import { IApiService } from "@api";
import {
  ChatDto,
  IBanMemberBody,
  ICreateInviteBody,
  IUpdateChannelBody,
  IUpdateChatBody,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { EntityHolder } from "@store/holders";
import { action, makeAutoObservable } from "mobx";

import { IChatStore } from "./ChatStore.types";

@IChatStore({ inSingleton: true })
export class ChatStore implements IChatStore {
  public chatHolder = new EntityHolder<ChatDto, string>({
    onFetch: id => this._api.getChatById({ id }),
  });

  public currentChatId: string | null = null;

  constructor(@IApiService() private _api: IApiService) {
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

  get isLoading(): boolean {
    return this.chatHolder.isLoading;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  async openChat(chatId: string): Promise<void> {
    this.currentChatId = chatId;
    await this.chatHolder.load(chatId);
  }

  closeChat(): void {
    this.currentChatId = null;
    this.chatHolder.reset();
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

  handleMemberJoined(chatId: string, _userId: string): void {
    if (this.currentChatId === chatId) {
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

    // Обновляем peer (direct-чат)
    if (chat.peer?.userId === profile.userId && chat.peer.profile) {
      this.chatHolder.setData({
        ...chat,
        peer: { ...chat.peer, profile: { ...chat.peer.profile, ...profile } },
      });

      return;
    }

    // Обновляем в members (группы/каналы)
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
      this.chatHolder.setData({ ...chat, members: updatedMembers });
    }
  }
}
