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

  /** `audit:created` в ленту; после переподключения (обрыв, фон) загруженная лента перечитывается. */
  initialize() {
    let connected = this._transport.state.status === "connected";
    const unsubscribe = [
      this._transport.onConnect(() => {
        if (connected && this._store.eventsHolder.isSuccess) this._store.load();
        connected = true;
      }),
      this._transport.on<[AuditEventDto]>("audit:created", event =>
        this._store.prepend(event),
      ),
    ];

    return () => unsubscribe.forEach(off => off());
  }
}
