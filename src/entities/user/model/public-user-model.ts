import { PublicUserDto } from "@shared/api/gen/main/model";
import { DataModelBase } from "@shared/lib/models";
import { DateModel } from "@shared/lib/models/date";
import { formatFullName, formatInitials } from "@shared/lib/utils";
import { LambdaValue } from "@shared/lib/utils/lambda-value";
import { computed, makeObservable } from "mobx";

export class PublicUserModel extends DataModelBase<PublicUserDto> {
  public readonly lastOnlineDate = new DateModel(
    () => this.data.profile?.lastOnline,
  );

  constructor(data: LambdaValue<PublicUserDto>) {
    super(data);
    makeObservable(this, {
      id: computed,
      displayName: computed,
      initials: computed,
      lastOnline: computed,
    });
  }

  get id() {
    return this.data.userId;
  }

  get displayName() {
    const p = this.data.profile;

    return formatFullName(
      p?.firstName,
      p?.lastName,
      this.data.username || "Unknown",
    );
  }

  get initials() {
    const p = this.data.profile;

    return formatInitials(
      p?.firstName,
      p?.lastName,
      this.data.username?.[0]?.toUpperCase() ?? "U",
    );
  }

  get lastOnline() {
    return this.lastOnlineDate.data
      ? this.lastOnlineDate.formattedDate
      : undefined;
  }
}
