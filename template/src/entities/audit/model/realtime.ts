import type { AuditEventDto } from "@shared/api/gen/main/model";
import { ISocketTransport } from "@shared/lib/socket";
import { injectable } from "inversify";

import { IAuditRealtime, IAuditStore } from "./types";

@injectable()
export class AuditRealtime implements IAuditRealtime {
  constructor(
    @ISocketTransport() private _transport: ISocketTransport,
    @IAuditStore() private _store: IAuditStore,
  ) {}

  initialize() {
    return this._transport.on<[AuditEventDto]>("audit:created", event =>
      this._store.prepend(event),
    );
  }
}
