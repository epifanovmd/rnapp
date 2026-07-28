import { createInjectDecorator } from "@shared/lib/di";
import { SupportInitialize } from "@shared/lib/utils";
import { Socket as SocketIO } from "socket.io-client";

import {
  SocketClientToServerEvents,
  SocketServerToClientEvents,
} from "../events";

export type AppSocket = SocketIO<
  SocketServerToClientEvents,
  SocketClientToServerEvents
>;

export type SocketConnectionStatus =
  "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface SocketTransportState {
  status: SocketConnectionStatus;
  error: Error | null;
}

export type SocketStatusListener = (state: SocketTransportState) => void;

export const ISocketTransport = createInjectDecorator<ISocketTransport>();

export interface ISocketTransport extends SupportInitialize {
  readonly state: SocketTransportState;

  initialize(): () => void;
  connect(): Promise<void>;
  disconnect(): void;

  on<K extends keyof SocketServerToClientEvents>(
    event: K,
    handler: SocketServerToClientEvents[K],
  ): () => void;

  emit<K extends keyof SocketClientToServerEvents>(
    event: K,
    ...args: Parameters<SocketClientToServerEvents[K]>
  ): void;

  /**
   * Emit with acknowledgement and automatic retry.
   * Returns the ack response from the server.
   * Retries up to `maxRetries` times with exponential backoff on failure/timeout.
   */
  emitWithAck<T = unknown>(
    event: string,
    data: unknown,
    opts?: { timeoutMs?: number; maxRetries?: number },
  ): Promise<T>;

  onConnect(handler: () => void): () => void;
  onDisconnect(handler: (reason: string) => void): () => void;
  onStatusChange(listener: SocketStatusListener): () => void;
}
