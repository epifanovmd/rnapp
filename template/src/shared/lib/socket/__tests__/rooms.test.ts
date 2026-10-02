import { subscribeSocketRoom } from "../rooms";
import { createFakeSocket } from "../testing";

describe("subscribeSocketRoom", () => {
  it("после переподключения — снова вход в комнату и onRejoin; после отписки — нет", () => {
    const socket = createFakeSocket();
    const onRejoin = jest.fn();
    const unsubscribe = subscribeSocketRoom(
      socket,
      "wg-forwards",
      "all",
      onRejoin,
    );

    expect(onRejoin).not.toHaveBeenCalled();

    socket.reconnect();
    expect(
      socket.emitted.filter(e => e.event === "room:subscribe"),
    ).toHaveLength(2);
    expect(onRejoin).toHaveBeenCalledTimes(1);

    unsubscribe();
    socket.reconnect();
    expect(onRejoin).toHaveBeenCalledTimes(1);
    expect(socket.emitted.at(-1)?.event).toBe("room:unsubscribe");
    expect(socket.emitted.at(-1)?.args[0]).toEqual({
      type: "wg-forwards",
      id: "all",
    });
  });

  it("нет прав на комнату — не переподписывается и не перечитывает", () => {
    const socket = createFakeSocket();
    const onRejoin = jest.fn();

    socket.emit = (event, ...args) => {
      socket.emitted.push({ event, args });
      const ack = args.at(-1);

      if (typeof ack === "function") ack({ ok: false });
    };
    subscribeSocketRoom(socket, "wg-socks", "all", onRejoin);
    socket.reconnect();

    expect(onRejoin).not.toHaveBeenCalled();
    expect(
      socket.emitted.filter(e => e.event === "room:subscribe"),
    ).toHaveLength(1);
  });

  it("сервер отозвал комнату — без повторного входа и перечитывания", () => {
    const socket = createFakeSocket();
    const onRejoin = jest.fn();

    subscribeSocketRoom(socket, "wg-socks", "all", onRejoin);
    subscribeSocketRoom(socket, "wg-forwards", "all");
    socket.fire("room:revoked", { type: "wg-socks", id: "all" });
    socket.reconnect();

    expect(onRejoin).not.toHaveBeenCalled();
    expect(
      socket.emitted
        .filter(e => e.event === "room:subscribe")
        .map(e => (e.args[0] as { type: string }).type),
    ).toEqual(["wg-socks", "wg-forwards", "wg-forwards"]);
  });

  it("подписка до подключения — один вход после connect, без onRejoin", () => {
    const socket = createFakeSocket();
    const onRejoin = jest.fn();

    (socket as { state: unknown }).state = {
      status: "connecting",
      error: null,
    };
    subscribeSocketRoom(socket, "wg-socks", "all", onRejoin);
    expect(socket.emitted).toHaveLength(0);

    (socket as { state: unknown }).state = {
      status: "connected",
      error: null,
    };
    socket.reconnect();

    expect(
      socket.emitted.filter(e => e.event === "room:subscribe"),
    ).toHaveLength(1);
    expect(onRejoin).not.toHaveBeenCalled();
  });

  it("общая комната двух подписчиков — один вход, выход только после последней отписки", () => {
    const socket = createFakeSocket();
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = subscribeSocketRoom(socket, "users", "all", first);
    const unsubscribeSecond = subscribeSocketRoom(
      socket,
      "users",
      "all",
      second,
    );
    const count = (event: string) =>
      socket.emitted.filter(e => e.event === event).length;

    expect(count("room:subscribe")).toBe(1);

    unsubscribeFirst();
    unsubscribeFirst();
    expect(count("room:unsubscribe")).toBe(0);

    socket.reconnect();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(count("room:subscribe")).toBe(2);

    unsubscribeSecond();
    expect(count("room:unsubscribe")).toBe(1);

    subscribeSocketRoom(socket, "users", "all");
    expect(count("room:subscribe")).toBe(3);
  });

  it("сокет не подключён — отписка не уходит в очередь отправки", () => {
    const socket = createFakeSocket();
    const unsubscribe = subscribeSocketRoom(socket, "users", "all");

    (socket as { state: unknown }).state = {
      status: "disconnected",
      error: null,
    };
    unsubscribe();

    expect(socket.emitted.map(e => e.event)).toEqual(["room:subscribe"]);
  });

  it("комната с отказом — новый подписчик пробует войти заново", () => {
    const socket = createFakeSocket();
    const send = socket.emit;
    let allowed = false;

    socket.emit = (event, ...args) => {
      if (event !== "room:subscribe") return send(event, ...args);
      socket.emitted.push({ event, args });
      const ack = args.at(-1);

      if (typeof ack === "function") ack({ ok: allowed });
    };
    subscribeSocketRoom(socket, "roles", "all");
    allowed = true;
    subscribeSocketRoom(socket, "roles", "all");
    socket.reconnect();

    expect(
      socket.emitted.filter(e => e.event === "room:subscribe"),
    ).toHaveLength(3);
  });
});
