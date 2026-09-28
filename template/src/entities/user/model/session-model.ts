import { SessionDto } from "@shared/api/gen/main/model";
import { TypedModel } from "@shared/lib/models";
import { DateModel } from "@shared/lib/models/date";
import { describeUserAgent } from "@shared/lib/utils";

export class SessionModel extends TypedModel<SessionDto>() {
  public readonly lastActiveAtDate = new DateModel(
    () => this.data.lastActiveAt,
  );
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  /** Имя устройства с сервера; без него — приложение/браузер и ОС из User-Agent. */
  get deviceName() {
    return this.data.deviceName ?? describeUserAgent(this.data.userAgent);
  }
}
