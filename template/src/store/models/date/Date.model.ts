import { formatter, Maybe } from "@utils";

import { DataModelBase } from "../DataModelBase";

export class DateModel extends DataModelBase<Maybe<string | null>> {
  get formatted() {
    return formatter.date.format(this.data);
  }

  get formattedDate() {
    return formatter.date.formatDate(this.data);
  }

  get formattedTime() {
    return formatter.date.formatTime(this.data);
  }

  get formattedInputDate() {
    return formatter.date.formatInputDate(this.data);
  }

  get formattedDiff() {
    return formatter.date.formatDiff(this.data);
  }

  get isExpired() {
    return formatter.date.isExpired(this.data);
  }
}
