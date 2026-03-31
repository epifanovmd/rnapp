import { IApiService } from "@api";
import {
  ChatDto,
  ContactDto,
  ESyncAction,
  ESyncEntityType,
  MessageDto,
  ProfileDto,
} from "@api/api-gen/data-contracts";
import { IStorageService } from "@core/platform/IStorageService";
import { makeAutoObservable } from "mobx";

import { IChatListStore } from "../chatList";
import { IContactStore } from "../contacts";
import { IMessageStore } from "../message";
import { IProfileStore } from "../profile";
import { ISyncStore } from "./SyncStore.types";

const SYNC_VERSION_KEY = "messenger:sync_version";

@ISyncStore({ inSingleton: true })
export class SyncStore implements ISyncStore {
  public lastSyncVersion: string | null = null;
  public isSyncing = false;

  constructor(
    @IApiService() private _api: IApiService,
    @IStorageService() private _storage: IStorageService,
    @IChatListStore() private _chatListStore: IChatListStore,
    @IMessageStore() private _messageStore: IMessageStore,
    @IContactStore() private _contactStore: IContactStore,
    @IProfileStore() private _profileStore: IProfileStore,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });

    this.lastSyncVersion = this._storage.getItem(SYNC_VERSION_KEY);
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const res = await this._api.getChanges({
        sinceVersion: this.lastSyncVersion ?? undefined,
        limit: 100,
      });

      if (res.data) {
        for (const change of res.data.changes) {
          this._applyChange(
            change.entityType,
            change.action,
            change.entityId,
            change.payload as Record<string, unknown> | null,
          );
        }

        this.lastSyncVersion = res.data.currentVersion;
        this._storage.setItem(SYNC_VERSION_KEY, res.data.currentVersion);

        if (res.data.hasMore) {
          await this.sync();
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  handleSyncAvailable(_version: string): void {
    this.sync();
  }

  private _applyChange(
    entityType: ESyncEntityType,
    action: ESyncAction,
    _entityId: string,
    payload: Record<string, unknown> | null,
  ): void {
    if (!payload) return;

    switch (entityType) {
      case ESyncEntityType.Message:
        this._applyMessageChange(action, payload as unknown as MessageDto);
        break;
      case ESyncEntityType.Chat:
        this._applyChatChange(action, payload as unknown as ChatDto);
        break;
      case ESyncEntityType.ChatMember:
        // Member changes affect the chat list — reload
        if (action !== ESyncAction.Delete) {
          this._chatListStore.load();
        }
        break;
      case ESyncEntityType.Contact:
        this._applyContactChange(action, payload as unknown as ContactDto);
        break;
      case ESyncEntityType.Profile:
        this._profileStore.handleProfileUpdated(
          payload as unknown as ProfileDto,
        );
        break;
    }
  }

  private _applyMessageChange(action: ESyncAction, message: MessageDto): void {
    switch (action) {
      case ESyncAction.Create:
        this._messageStore.handleNewMessage(message);
        this._chatListStore.handleNewMessage(message);
        break;
      case ESyncAction.Update:
        this._messageStore.handleMessageUpdated(message);
        break;
      case ESyncAction.Delete:
        this._messageStore.handleMessageDeleted(message.id);
        break;
    }
  }

  private _applyChatChange(action: ESyncAction, chat: ChatDto): void {
    switch (action) {
      case ESyncAction.Create:
        this._chatListStore.handleChatCreated(chat);
        break;
      case ESyncAction.Update:
        this._chatListStore.handleChatUpdated(chat);
        break;
      case ESyncAction.Delete:
        // Chat deleted — remove from list
        this._chatListStore.listHolder.removeItem(chat.id);
        break;
    }
  }

  private _applyContactChange(action: ESyncAction, contact: ContactDto): void {
    switch (action) {
      case ESyncAction.Create:
        this._contactStore.handleContactRequest(contact);
        break;
      case ESyncAction.Update:
        this._contactStore.handleContactAccepted(contact);
        break;
      case ESyncAction.Delete:
        this._contactStore.contactsHolder.removeItem(contact.id);
        break;
    }
  }
}
