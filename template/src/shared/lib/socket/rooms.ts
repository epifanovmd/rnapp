import type { ISocketTransport } from "./transport/socket.transport.types";

interface IRoomAck {
  ok: boolean;
  error?: { code: string; message: string };
}

interface IRoomPayload {
  type: string;
  id: string;
}

/**
 * Подписка на серверную комнату (`room:subscribe { type, id }`) с
 * автоматическим восстановлением после reconnect. `onRejoin` — после
 * повторного входа: события за время обрыва потеряны, данные нужно
 * перечитать. Отказ сервера или `room:revoked` (права больше нет) —
 * подписка прекращается. Возвращает отписку.
 */
export const subscribeSocketRoom = (
  socket: ISocketTransport,
  type: string,
  id: string,
  onRejoin?: () => void,
): (() => void) => {
  let active = true;
  let joined = false;

  const join = (): void => {
    if (!active) return;

    socket.emit("room:subscribe", { type, id }, (ack: IRoomAck) => {
      if (!ack?.ok && active) {
        // Нет прав или комната недоступна — повторять бессмысленно.
        active = false;
      }
    });
  };

  // Не подключён — войдём по connect: иначе запрос ушёл бы дважды (из
  // очереди отправки и из обработчика подключения).
  if (socket.state.status === "connected") {
    join();
    joined = true;
  }

  const offConnect = socket.onConnect(() => {
    const isRejoin = joined;

    join();
    joined = true;
    if (active && isRejoin) onRejoin?.();
  });

  const offRevoked = socket.on<[IRoomPayload]>("room:revoked", room => {
    if (room.type === type && room.id === id) active = false;
  });

  return () => {
    active = false;
    offConnect();
    offRevoked();
    socket.emit("room:unsubscribe", { type, id });
  };
};
