import type { IFileDto } from "@shared/api/gen/main/model";
import { ISocketTransport } from "@shared/lib/socket";
import { injectable } from "inversify";

import { IFileRealtime, IFileStore } from "./types";

@injectable()
export class FileRealtime implements IFileRealtime {
  constructor(
    @ISocketTransport() private _transport: ISocketTransport,
    @IFileStore() private _store: IFileStore,
  ) {}

  initialize() {
    const unsubscribe = [
      this._transport.on<[IFileDto]>("file:uploaded", file =>
        this._store.handleFileUploaded(file),
      ),
      this._transport.on<[IFileDto]>("file:processed", file =>
        this._store.handleFileProcessed(file),
      ),
      this._transport.on<[{ id: string }]>("file:deleted", ({ id }) =>
        this._store.handleFileDeleted(id),
      ),
    ];

    return () => unsubscribe.forEach(off => off());
  }
}
