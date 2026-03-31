import { ContactDto, EContactStatus } from "@api/api-gen/data-contracts";
import { computed, makeObservable } from "mobx";

import { DataModelBase } from "../DataModelBase";
import { DateModel } from "../date";

export class ContactModel extends DataModelBase<ContactDto> {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  constructor(data: ContactDto) {
    super(data);
    makeObservable(this, {
      displayName: computed,
      isPending: computed,
      isAccepted: computed,
      isBlocked: computed,
      statusLabel: computed,
      contactUserId: computed,
    });
  }

  get displayName(): string {
    if (this.data.displayName) return this.data.displayName;

    const p = this.data.contactProfile;

    if (p) {
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ");

      if (name) return name;
    }

    return "Контакт";
  }

  get isPending(): boolean {
    return this.data.status === EContactStatus.Pending;
  }

  get isAccepted(): boolean {
    return this.data.status === EContactStatus.Accepted;
  }

  get isBlocked(): boolean {
    return this.data.status === EContactStatus.Blocked;
  }

  get statusLabel(): string {
    switch (this.data.status) {
      case EContactStatus.Pending:
        return "Ожидает";
      case EContactStatus.Accepted:
        return "Контакт";
      case EContactStatus.Blocked:
        return "Заблокирован";
      default:
        return "";
    }
  }

  get contactUserId(): string {
    return this.data.contactUserId;
  }
}
