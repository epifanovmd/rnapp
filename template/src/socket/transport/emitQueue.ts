import { AppSocket } from "./socketTransport.types";

/**
 * Queue for buffering emitted events while socket is disconnected.
 * Flushes queued emissions once the socket connects.
 */
export class EmitQueue {
  private _queue: Array<(socket: AppSocket) => void> = [];

  enqueue(fn: (socket: AppSocket) => void): void {
    this._queue.push(fn);
  }

  flush(socket: AppSocket): void {
    this._queue.splice(0).forEach(fn => fn(socket));
  }

  clear(): void {
    this._queue = [];
  }
}
