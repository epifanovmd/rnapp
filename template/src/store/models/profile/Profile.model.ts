import { KnownRole, ProfileDto } from "@api/api-gen/data-contracts";
import { formatFullName, formatInitials } from "@utils";
import { LambdaValue } from "@utils/lambdaValue";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class ProfileModel extends TypedModel<ProfileDto>() {
  public readonly registeredAtDate = new DateModel(() => this.data?.createdAt);
  public readonly lastOnlineDate = new DateModel(() => this.data.lastOnline);
  public readonly birthDateModel = new DateModel(() => this.data.birthDate);

  constructor(data: LambdaValue<ProfileDto>) {
    super(data);
  }

  get displayName() {
    return formatFullName(
      this.data.firstName,
      this.data.lastName,
      this.email || this.phone || "Без имени",
    );
  }

  get initials() {
    return formatInitials(
      this.data.firstName,
      this.data.lastName,
      this.data.user?.email?.[0] ?? "U",
    );
  }

  get email() {
    return this.data.user?.email;
  }

  get phone() {
    return this.data.user?.phone;
  }

  get login() {
    return this.email ?? this.phone;
  }

  get roleLabel() {
    return this.data.user?.roles?.[0]?.name ?? KnownRole.User;
  }

  get emailVerified() {
    return this.data.user?.emailVerified;
  }
}
