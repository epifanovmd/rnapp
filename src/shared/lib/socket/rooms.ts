import type { ISocketTransport } from "./transport/socket.transport.types";

interface IRoomAck {
  ok: boolean;
  error?: { code: string; message: string };
}

interface IRoomPayload {
  type: string;
  id: string;
}

interface IRoomEntry {
  /** Число активных подписчиков комнаты. */
  refs: number;
  /** false — сервер отказал или отозвал комнату: повторный вход не нужен. */
  active: boolean;
  /** Вход уже отправлялся — следующий connect считается переподключением. */
  joined: boolean;
  rejoinListeners: Set<() => void>;
  join: () => void;
  dispose: () => void;
}

const roomsBySocket = new WeakMap<ISocketTransport, Map<string, IRoomEntry>>();

/** Общее состояние комнаты `type:id`: вход, переподключение, отзыв прав. */
const createRoomEntry = (
  socket: ISocketTransport,
  type: string,
  id: string,
): IRoomEntry => {
  const entry: IRoomEntry = {
    refs: 0,
    active: true,
    joined: false,
    rejoinListeners: new Set(),
    join: () => {
      if (!entry.active) return;

      socket.emit("room:subscribe", { type, id }, (ack: IRoomAck) => {
        // Нет прав или комната недоступна — повторять бессмысленно.
        if (!ack?.ok) entry.active = false;
      });
    },
    dispose: () => undefined,
  };

  const offConnect = socket.onConnect(() => {
    const isRejoin = entry.joined;

    entry.join();
    entry.joined = true;
    if (entry.active && isRejoin) {
      entry.rejoinListeners.forEach(listener => listener());
    }
  });

  const offRevoked = socket.on<[IRoomPayload]>("room:revoked", room => {
    if (room.type === type && room.id === id) entry.active = false;
  });

  entry.dispose = () => {
    offConnect();
    offRevoked();
  };

  return entry;
};

/**
 * Подписка на серверную комнату (`room:subscribe { type, id }`) с
 * автоматическим восстановлением после reconnect. Подписки на одну комнату
 * считаются по ссылкам: вход — у первого подписчика, выход
 * (`room:unsubscribe`, только при подключённом сокете) — после отписки
 * последнего. `onRejoin` — после повторного входа: события за время обрыва
 * потеряны, данные нужно перечитать. Отказ сервера или `room:revoked`
 * (права больше нет) — повторные входы прекращаются. Возвращает отписку.
 */
export const subscribeSocketRoom = (
  socket: ISocketTransport,
  type: string,
  id: string,
  onRejoin?: () => void,
): (() => void) => {
  const key = `${type}:${id}`;
  const rooms = roomsBySocket.get(socket) ?? new Map<string, IRoomEntry>();
  const isConnected = socket.state.status === "connected";

  roomsBySocket.set(socket, rooms);

  let room = rooms.get(key);

  if (!room) {
    room = createRoomEntry(socket, type, id);
    rooms.set(key, room);
    // Не подключён — войдём по connect: иначе запрос ушёл бы дважды (из
    // очереди отправки и из обработчика подключения).
    if (isConnected) {
      room.join();
      room.joined = true;
    }
  } else if (!room.active) {
    // Отказ мог случиться до смены прав — новый подписчик входит заново.
    room.active = true;
    if (isConnected) room.join();
  }

  const entry = room;
  const listener = () => onRejoin?.();
  let subscribed = true;

  entry.refs++;
  entry.rejoinListeners.add(listener);

  return () => {
    if (!subscribed) return;
    subscribed = false;
    entry.rejoinListeners.delete(listener);
    entry.refs--;

    if (entry.refs > 0) return;

    rooms.delete(key);
    entry.dispose();
    if (socket.state.status === "connected") {
      socket.emit("room:unsubscribe", { type, id });
    }
  };
};
