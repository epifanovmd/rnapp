import type { JobRunDto } from "@shared/api/gen/main/model";
import { ISocketTransport } from "@shared/lib/socket";
import { injectable } from "inversify";

import { IJobRealtime, IJobStore } from "./types";

@injectable()
export class JobRealtime implements IJobRealtime {
  constructor(
    @ISocketTransport() private _transport: ISocketTransport,
    @IJobStore() private _store: IJobStore,
  ) {}

  /** `job:updated` в стор; после переподключения (обрыв, фон) загруженный список перечитывается. */
  initialize() {
    let connected = this._transport.state.status === "connected";
    const unsubscribe = [
      this._transport.onConnect(() => {
        if (connected && !this._store.jobsHolder.isIdle) this._store.refresh();
        connected = true;
      }),
      this._transport.on<[JobRunDto]>("job:updated", job =>
        this._store.handleJobUpdated(job),
      ),
    ];

    return () => unsubscribe.forEach(off => off());
  }
}
