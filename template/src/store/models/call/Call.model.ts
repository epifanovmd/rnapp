import { CallDto, ECallStatus, ECallType } from "@api/api-gen/data-contracts";
import { computed, makeObservable } from "mobx";

import { DataModelBase } from "../DataModelBase";
import { DateModel } from "../date";

export class CallModel extends DataModelBase<CallDto> {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);

  constructor(data: CallDto) {
    super(data);
    makeObservable(this, {
      isVoice: computed,
      isVideo: computed,
      isRinging: computed,
      isActive: computed,
      isEnded: computed,
      isMissed: computed,
      isDeclined: computed,
      callerName: computed,
      calleeName: computed,
      formattedDuration: computed,
      statusLabel: computed,
    });
  }

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

    if (!c) return "Unknown";

    return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown";
  }

  get calleeName(): string {
    const c = this.data.callee;

    if (!c) return "Unknown";

    return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown";
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
