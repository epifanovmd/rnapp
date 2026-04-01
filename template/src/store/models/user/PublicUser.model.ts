import { PublicUserDto } from "@api/api-gen/data-contracts";
import { formatFullName, formatInitials } from "@utils";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class PublicUserModel extends TypedModel<PublicUserDto>() {
  public readonly lastOnlineDate = new DateModel(
    () => this.data.profile?.lastOnline,
  );

  get id() {
    return this.data.userId;
  }

  get displayName() {
    const p = this.data.profile;

    return formatFullName(
      p?.firstName,
      p?.lastName,
      this.data.email || "Unknown",
    );
  }

  get initials() {
    const p = this.data.profile;

    return formatInitials(
      p?.firstName,
      p?.lastName,
      this.data.email?.[0] ?? "U",
    );
  }

  get lastOnline() {
    return this.lastOnlineDate.data
      ? this.lastOnlineDate.formattedDate
      : undefined;
  }
}
