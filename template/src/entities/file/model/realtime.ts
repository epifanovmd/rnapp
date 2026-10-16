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

  /** События файлов в стор; после переподключения (обрыв, фон) загруженный список перечитывается. */
  initialize() {
    let connected = this._transport.state.status === "connected";
    const unsubscribe = [
      this._transport.onConnect(() => {
        if (connected && !this._store.filesHolder.isIdle) {
          this._store.refresh();
        }
        connected = true;
      }),
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
