import {
  ChatDto,
  EChatMemberRole,
  EChatType,
} from "@api/api-gen/data-contracts";
import { formatFullName } from "@utils";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class ChatModel extends TypedModel<ChatDto>() {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);
  public readonly lastMessageDate = new DateModel(
    () => this.data.lastMessageAt,
  );

  get displayName(): string {
    if (this.data.name) return this.data.name;
    if (this.isDirect && this.data.members.length > 0) {
      const other = this.data.members.find(
        m => m.userId !== this.data.createdById,
      );

      if (other?.profile) {
        return formatFullName(
          other.profile.firstName,
          other.profile.lastName,
          "Чат",
        );
      }
    }

    return "Чат";
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
