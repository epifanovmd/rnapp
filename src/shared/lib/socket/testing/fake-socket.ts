import type { ISocketTransport } from "../transport/socket.transport.types";

export interface IFakeSocket extends ISocketTransport {
  /** Доставить событие сервера подписчикам. */
  fire: (event: string, ...args: unknown[]) => void;
  /** Переподключение: сработают обработчики `onConnect`. */
  reconnect: () => void;
  /** Отправленные клиентом события (`room:subscribe` и т. п.). */
  emitted: Array<{ event: string; args: unknown[] }>;
}

/**
 * Фейковый транспорт для тестов моделей: подписки, отправка и
 * переподключение без сети. На `room:subscribe` отвечает `{ ok: true }`.
 */
export const createFakeSocket = (): IFakeSocket => {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  const connectHandlers = new Set<() => void>();
  const emitted: IFakeSocket["emitted"] = [];

  return {
    state: { status: "connected", error: null },
    initialize: () => () => undefined,
    connect: async () => undefined,
    disconnect: () => undefined,
    on: (event, handler) => {
      const set = handlers.get(event) ?? new Set();

      set.add(handler as (...args: unknown[]) => void);
      handlers.set(event, set);

      return () => set.delete(handler as (...args: unknown[]) => void);
    },
    emitWithAck: async () => undefined as never,
    emit: (event, ...args) => {
      emitted.push({ event, args });

      const ack = args[args.length - 1];

      if (event === "room:subscribe" && typeof ack === "function") {
        ack({ ok: true });
      }
    },
    onConnect: handler => {
      connectHandlers.add(handler);

      return () => connectHandlers.delete(handler);
    },
    onDisconnect: () => () => undefined,
    onStatusChange: () => () => undefined,
    fire: (event, ...args) => {
      for (const handler of handlers.get(event) ?? []) handler(...args);
    },
    reconnect: () => {
      for (const handler of connectHandlers) handler();
    },
    emitted,
  };
};
