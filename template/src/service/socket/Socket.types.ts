import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";
import { Socket as SocketIO } from "socket.io-client";

export interface SocketEvents {
  authenticated: (...args: [{ userId: string }]) => void;
  auth_error: (...args: [{ message: string }]) => void;
}

export interface SocketEmitEvents {
  checkOnline: (
    ...args: [userId: string, callback: (isOnline: boolean) => void]
  ) => void;
}

export type Socket = SocketIO<SocketEvents, SocketEmitEvents>;

export const ISocketService = createServiceDecorator<ISocketService>();

export interface ISocketService extends SupportInitialize {
  isConnected: boolean;

  initialize(): () => void;

  emit<K extends keyof SocketEmitEvents>(
    event: K,
    ...args: Parameters<SocketEmitEvents[K]>
  ): Promise<Socket>;

  on<K extends keyof SocketEvents>(
    event: K,
    onEvent: SocketEvents[K],
    unsubscribe?: () => void,
  ): () => void;

  connect(): Promise<Socket | undefined>;

  disconnect(): void;
}
