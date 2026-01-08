import { DialogMessagesDto, PublicUserDto } from "@api/api-gen/data-contracts";
import { iocHook } from "@force-dev/react";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";
import { Socket as SocketIO } from "socket.io-client";

export interface SocketEvents {
  authenticated: (...args: [{ userId: string }]) => void;
  auth_error: (...args: [{ message: string }]) => void;
  message: (...args: [message: DialogMessagesDto]) => void;
  messageReceived: (
    ...args: [{ messageIds: string[]; dialogId: string }]
  ) => void;
  deleteMessage: (...args: [dialogId: string, messageId: string]) => void;
  newDialog: (...args: [dialogId: string]) => void;
  deleteDialog: (...args: [dialogId: string]) => void;
  online: (...args: [{ userId: string; isOnline: boolean }]) => void;
  checkOnline: (...args: [isOnline: boolean]) => void;
  typing: (...args: [{ user: PublicUserDto; isTyping: boolean }]) => void;
}

export interface SocketEmitEvents {
  messageReceived: (...args: [messageId: string[], dialogId: string]) => void;
  online: (...args: [isOnline: boolean]) => void;
  checkOnline: (
    ...args: [userId: string, callback: (isOnline: boolean) => void]
  ) => void;
  typing: (...args: [dialogId: string]) => void;
  join_dialog: (...args: [dialogId: string]) => void;
  leave_dialog: (...args: [dialogId: string]) => void;
}

export type Socket = SocketIO<SocketEvents, SocketEmitEvents>;

export const ISocketService = createServiceDecorator<ISocketService>();
export const useSocketService = iocHook(ISocketService);

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

  reconnect(): Promise<Socket | undefined>;
  disconnect(): void;
}
