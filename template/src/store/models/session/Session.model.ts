import { SessionDto } from "@api/api-gen/data-contracts";

import { DataModelBase } from "../DataModelBase";

export class SessionModel extends DataModelBase<SessionDto> {
  get id() {
    return this.data.id;
  }

  get deviceName() {
    return this.data.deviceName ?? "Unknown device";
  }

  get deviceType() {
    return this.data.deviceType;
  }

  get ip() {
    return this.data.ip;
  }

  get userAgent() {
    return this.data.userAgent;
  }

  get lastActiveAt() {
    return this.data.lastActiveAt ? new Date(this.data.lastActiveAt) : null;
  }

  get createdAt() {
    return new Date(this.data.createdAt);
  }

  get isCurrentSession() {
    // Can be determined by comparing with auth sessionId
    return false;
  }
}
