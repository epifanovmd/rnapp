import { CallDto, ECallStatus, ECallType } from "@api/api-gen/data-contracts";
import { formatFullName } from "@utils";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class CallModel extends TypedModel<CallDto>() {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  get isVoice(): boolean {
    return this.data.type === ECallType.Voice;
  }

  get isVideo(): boolean {
    return this.data.type === ECallType.Video;
  }

  get isRinging(): boolean {
    return this.data.status === ECallStatus.Ringing;
  }

  get isActive(): boolean {
    return this.data.status === ECallStatus.Active;
  }

  get isEnded(): boolean {
    return this.data.status === ECallStatus.Ended;
  }

  get isMissed(): boolean {
    return this.data.status === ECallStatus.Missed;
  }

  get isDeclined(): boolean {
    return this.data.status === ECallStatus.Declined;
  }

  get callerName(): string {
    const c = this.data.caller;

    return c ? formatFullName(c.firstName, c.lastName) : "Unknown";
  }

  get calleeName(): string {
    const c = this.data.callee;

    return c ? formatFullName(c.firstName, c.lastName) : "Unknown";
  }

  get formattedDuration(): string {
    const d = this.data.duration;

    if (!d) return "0:00";
    const m = Math.floor(d / 60);
    const s = d % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  get statusLabel(): string {
    switch (this.data.status) {
      case ECallStatus.Ringing:
        return "Вызов";
      case ECallStatus.Active:
        return "Активный";
      case ECallStatus.Ended:
        return "Завершён";
      case ECallStatus.Missed:
        return "Пропущен";
      case ECallStatus.Declined:
        return "Отклонён";
      default:
        return "";
    }
  }
}
