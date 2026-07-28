import { SessionDto } from "@shared/api/gen/model";
import { TypedModel } from "@shared/lib/models";
import { DateModel } from "@shared/lib/models/date";

export class SessionModel extends TypedModel<SessionDto>() {
  public readonly lastActiveAtDate = new DateModel(
    () => this.data.lastActiveAt,
  );
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  get deviceName() {
    return this.data.deviceName ?? "Unknown device";
  }
}
