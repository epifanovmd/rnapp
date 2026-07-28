import { PublicUserDto } from "@shared/api/gen/model";
import { TypedModel } from "@shared/lib/models";
import { DateModel } from "@shared/lib/models/date";
import { formatFullName, formatInitials } from "@shared/lib/utils";

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
      this.data.email || this.data.username || "Unknown",
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
