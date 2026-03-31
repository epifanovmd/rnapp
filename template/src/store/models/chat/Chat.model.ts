import {
  ChatDto,
  EChatMemberRole,
  EChatType,
} from "@api/api-gen/data-contracts";
import { computed, makeObservable } from "mobx";

import { DataModelBase } from "../DataModelBase";
import { DateModel } from "../date";

export class ChatModel extends DataModelBase<ChatDto> {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);
  public readonly lastMessageDate = new DateModel(
    () => this.data.lastMessageAt,
  );

  constructor(data: ChatDto) {
    super(data);
    makeObservable(this, {
      displayName: computed,
      avatarUrl: computed,
      isDirect: computed,
      isGroup: computed,
      isChannel: computed,
      memberCount: computed,
      isPublic: computed,
      ownerIds: computed,
      adminIds: computed,
    });
  }

  get displayName(): string {
    if (this.data.name) return this.data.name;
    if (this.isDirect && this.data.members.length > 0) {
      const other = this.data.members.find(
        m => m.userId !== this.data.createdById,
      );

      if (other?.profile) {
        const name = [other.profile.firstName, other.profile.lastName]
          .filter(Boolean)
          .join(" ");

        return name || "Чат";
      }
    }

    return "Чат";
  }

  get avatarUrl(): string | null {
    return this.data.avatarUrl;
  }

  get isDirect(): boolean {
    return this.data.type === EChatType.Direct;
  }

  get isGroup(): boolean {
    return this.data.type === EChatType.Group;
  }

  get isChannel(): boolean {
    return this.data.type === EChatType.Channel;
  }

  get memberCount(): number {
    return this.data.members.length;
  }

  get isPublic(): boolean {
    return this.data.isPublic;
  }

  get ownerIds(): string[] {
    return this.data.members
      .filter(m => m.role === EChatMemberRole.Owner)
      .map(m => m.userId);
  }

  get adminIds(): string[] {
    return this.data.members
      .filter(
        m =>
          m.role === EChatMemberRole.Admin || m.role === EChatMemberRole.Owner,
      )
      .map(m => m.userId);
  }
}
