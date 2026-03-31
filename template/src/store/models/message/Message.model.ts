import {
  EMessageStatus,
  EMessageType,
  MessageDto,
} from "@api/api-gen/data-contracts";
import { computed, makeObservable } from "mobx";

import { DataModelBase } from "../DataModelBase";
import { DateModel } from "../date";

export class MessageModel extends DataModelBase<MessageDto> {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);
  public readonly updatedAtDate = new DateModel(() => this.data.updatedAt);

  constructor(data: MessageDto) {
    super(data);
    makeObservable(this, {
      senderName: computed,
      formattedTime: computed,
      isEdited: computed,
      isPinned: computed,
      isDeleted: computed,
      hasAttachments: computed,
      hasReactions: computed,
      reactionsList: computed,
      isText: computed,
      isImage: computed,
      isFile: computed,
      isVoice: computed,
      isSystem: computed,
      isPoll: computed,
      contentPreview: computed,
      hasMentions: computed,
      statusIcon: computed,
    });
  }

  isOwn(currentUserId: string): boolean {
    return this.data.senderId === currentUserId;
  }

  get senderName(): string {
    const s = this.data.sender;

    if (!s) return "Unknown";
    const name = [s.firstName, s.lastName].filter(Boolean).join(" ");

    return name || "Unknown";
  }

  get formattedTime(): string {
    return this.createdAtDate.formattedTime ?? "";
  }

  get isEdited(): boolean {
    return this.data.isEdited;
  }

  get isPinned(): boolean {
    return this.data.isPinned;
  }

  get isDeleted(): boolean {
    return this.data.isDeleted;
  }

  get hasAttachments(): boolean {
    return this.data.attachments.length > 0;
  }

  get hasReactions(): boolean {
    return this.data.reactions.length > 0;
  }

  get reactionsList(): Array<{
    emoji: string;
    count: number;
    userIds: string[];
  }> {
    return this.data.reactions;
  }

  get isText(): boolean {
    return this.data.type === EMessageType.Text;
  }

  get isImage(): boolean {
    return this.data.type === EMessageType.Image;
  }

  get isFile(): boolean {
    return this.data.type === EMessageType.File;
  }

  get isVoice(): boolean {
    return this.data.type === EMessageType.Voice;
  }

  get isSystem(): boolean {
    return this.data.type === EMessageType.System;
  }

  get isPoll(): boolean {
    return this.data.type === EMessageType.Poll;
  }

  get contentPreview(): string {
    if (this.isDeleted) return "Сообщение удалено";
    if (this.data.content) return this.data.content;
    if (this.hasAttachments) {
      const count = this.data.attachments.length;

      return count === 1 ? "Вложение" : `${count} вложений`;
    }
    if (this.isVoice) return "Голосовое сообщение";
    if (this.isPoll) return "Опрос";

    return "";
  }

  get hasMentions(): boolean {
    return this.data.mentions.length > 0;
  }

  get statusIcon(): "sent" | "delivered" | "read" {
    switch (this.data.status) {
      case EMessageStatus.Delivered:
        return "delivered";
      case EMessageStatus.Read:
        return "read";
      default:
        return "sent";
    }
  }
}
