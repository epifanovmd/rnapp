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

  initialize() {
    return this._transport.on<[JobRunDto]>("job:updated", job =>
      this._store.handleJobUpdated(job),
    );
  }
}
