import { ContactDto, EContactStatus } from "@api/api-gen/data-contracts";
import { formatFullName } from "@utils";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class ContactModel extends TypedModel<ContactDto>() {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  get displayName(): string {
    if (this.data.displayName) return this.data.displayName;

    const p = this.data.contactProfile;

    return p ? formatFullName(p.firstName, p.lastName, "Контакт") : "Контакт";
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
}
