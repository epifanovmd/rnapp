import { SessionDto } from "@api/api-gen/data-contracts";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class SessionModel extends TypedModel<SessionDto>() {
  public readonly lastActiveAtDate = new DateModel(
    () => this.data.lastActiveAt,
  );
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  get deviceName() {
    return this.data.deviceName ?? "Unknown device";
  }
}
