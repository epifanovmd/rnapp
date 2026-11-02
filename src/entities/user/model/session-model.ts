import { SessionDto } from "@shared/api/gen/main/model";
import { DataModelBase } from "@shared/lib/models";
import { DateModel } from "@shared/lib/models/date";
import { describeUserAgent } from "@shared/lib/utils";
import { LambdaValue } from "@shared/lib/utils/lambda-value";
import { computed, makeObservable } from "mobx";

export class SessionModel extends DataModelBase<SessionDto> {
  public readonly lastActiveAtDate = new DateModel(
    () => this.data.lastActiveAt,
  );
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  constructor(data: LambdaValue<SessionDto>) {
    super(data);
    makeObservable(this, {
      deviceName: computed,
    });
  }

  /** Имя устройства с сервера; без него — приложение/браузер и ОС из User-Agent. */
  get deviceName() {
    return this.data.deviceName ?? describeUserAgent(this.data.userAgent);
  }
}
