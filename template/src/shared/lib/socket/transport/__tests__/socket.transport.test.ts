import { connect as ioConnect } from "socket.io-client";

import type { IAppStateService } from "../../../app-state";
import type { INetworkStatusService } from "../../../network";
import type { ITokenProvider } from "../../contract";
import { SocketTransport } from "../socket.transport";

jest.mock("socket.io-client", () => ({ connect: jest.fn() }));
jest.mock("@react-native-community/netinfo", () => ({}));

type Handler = (...args: any[]) => void;
type AuthOption = Record<string, unknown> | ((cb: Handler) => void);

/**
 * Фейковый socket.io-клиент. Как настоящий: `active` — клиент сам будет
 * переподключаться; отказ middleware и разрыв сервером его снимают.
 */
const createIoSocket = (auth: AuthOption) => {
  const handlers = new Map<string, Set<Handler>>();
  const fire = (event: string, ...args: unknown[]) =>
    [...(handlers.get(event) ?? [])].forEach(h => h(...args));

  const socket = {
    auth,
    active: false,
    connected: false,
    emitted: [] as Array<{ event: string; args: unknown[] }>,
    connectCalls: 0,
    io: { opts: { query: {} } },
    on: (event: string, h: Handler) => {
      handlers.set(event, (handlers.get(event) ?? new Set()).add(h));

      return socket;
    },
    once: (event: string, h: Handler) => {
      const wrapped = Object.assign(
        (...args: unknown[]) => {
          socket.off(event, h);
          h(...args);
        },
        { fn: h },
      );

      return socket.on(event, wrapped);
    },
    off: (event: string, h: Handler) => {
      handlers.get(event)?.forEach(item => {
        if (item === h || (item as { fn?: Handler }).fn === h) {
          handlers.get(event)!.delete(item);
        }
      });

      return socket;
    },
    removeAllListeners: () => {
      handlers.clear();

      return socket;
    },
    emit: (event: string, ...args: unknown[]) => {
      socket.emitted.push({ event, args });

      return socket;
    },
    connect: () => {
      socket.connectCalls++;
      socket.active = true;

      return socket;
    },
    disconnect: () => {
      const wasConnected = socket.connected;

      socket.active = false;
      socket.connected = false;
      if (wasConnected) fire("disconnect", "io client disconnect");

      return socket;
    },
    /** Данные handshake, которые клиент отправил бы серверу. */
    handshake: async (): Promise<Record<string, unknown>> => {
      if (typeof socket.auth !== "function") return socket.auth;

      const cb = socket.auth;

      return new Promise(resolve => cb(resolve));
    },
    accept: () => {
      socket.connected = true;
      fire("connect");
    },
    /** Отказ middleware: клиент сам больше не переподключается. */
    reject: (message: string) => {
      socket.active = false;
      fire("connect_error", new Error(message));
    },
    /** Сетевая ошибка: клиент переподключится сам. */
    transportError: () => fire("connect_error", new Error("websocket error")),
    kick: () => {
      socket.active = false;
      socket.connected = false;
      fire("disconnect", "io server disconnect");
    },
    fire,
  };

  return socket;
};

type IoSocket = ReturnType<typeof createIoSocket>;

const connectMock = jest.mocked(ioConnect);

let io: IoSocket;
let wake: (isActive: boolean) => void;
let appActive = true;
/** Смена активности приложения: сервис и подписчики видят одно и то же. */
const setAppActive = (isActive: boolean) => {
  appActive = isActive;
  wake(isActive);
};
let online: () => void;
let tokenListener: (token: string) => void;
let provider: ITokenProvider & {
  ensureFreshToken: jest.Mock;
  refreshToken: jest.Mock;
};

const createTransport = () => {
  const appState: IAppStateService = {
    get isActive() {
      return appActive;
    },
    onChange: cb => {
      wake = cb;

      return () => undefined;
    },
  };
  const network: INetworkStatusService = {
    isOnline: true,
    onOnline: cb => {
      online = cb;

      return () => undefined;
    },
    onOffline: () => () => undefined,
  };

  return new SocketTransport(provider, appState, network);
};

const flush = () => jest.advanceTimersByTimeAsync(0);

beforeEach(() => {
  jest.useFakeTimers();
  appActive = true;
  connectMock.mockClear();

  let token = "stale";

  provider = {
    get accessToken() {
      return token;
    },
    ensureFreshToken: jest.fn(async () => {
      token = "fresh";
    }),
    refreshToken: jest.fn(async () => {
      token = "refreshed";
    }),
    onTokenChange: cb => {
      tokenListener = cb;

      return () => undefined;
    },
  };

  connectMock.mockImplementation(((
    _url: string,
    opts: { auth: AuthOption },
  ) => {
    io = createIoSocket(opts.auth);

    return io;
  }) as never);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("SocketTransport", () => {
  it("handshake берёт токен после ensureFreshToken, а не устаревший", async () => {
    createTransport().initialize();

    await expect(io.handshake()).resolves.toEqual({ token: "fresh" });
    expect(provider.ensureFreshToken).toHaveBeenCalled();
  });

  it("токен не уходит в query URL", () => {
    createTransport().initialize();

    const opts = connectMock.mock.calls[0][1] as { query?: object };

    expect(opts.query ?? {}).toEqual({});
  });

  it("после отказа middleware переподключается тем же сокетом со свежим токеном", async () => {
    createTransport().initialize();
    io.reject("Срок действия токена истёк");

    await jest.advanceTimersByTimeAsync(1000);

    expect(provider.refreshToken).toHaveBeenCalledTimes(1);
    expect(io.connectCalls).toBe(2);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it("сетевую ошибку оставляет встроенному переподключению", async () => {
    createTransport().initialize();
    io.transportError();

    await jest.advanceTimersByTimeAsync(30_000);

    expect(io.connectCalls).toBe(1);
  });

  it("после разрыва сервером обновляет токен и переподключается", async () => {
    const transport = createTransport();

    transport.initialize();
    io.accept();
    io.kick();

    expect(transport.state.status).toBe("connecting");

    await jest.advanceTimersByTimeAsync(1000);

    expect(provider.refreshToken).toHaveBeenCalledTimes(1);
    expect(io.connectCalls).toBe(2);
  });

  it("повторяет с нарастающей задержкой, пока сервер отказывает", async () => {
    createTransport().initialize();
    io.reject("denied");
    await jest.advanceTimersByTimeAsync(1000);
    io.reject("denied");
    await jest.advanceTimersByTimeAsync(1000);

    expect(io.connectCalls).toBe(2);

    await jest.advanceTimersByTimeAsync(1000);

    expect(io.connectCalls).toBe(3);
  });

  it("успешное подключение сбрасывает задержку", async () => {
    createTransport().initialize();
    io.reject("denied");
    await jest.advanceTimersByTimeAsync(1000);
    io.accept();
    io.kick();
    await jest.advanceTimersByTimeAsync(1000);

    expect(io.connectCalls).toBe(3);
  });

  it("возвращение приложения поднимает неактивный сокет сразу, не пересоздавая", async () => {
    createTransport().initialize();
    io.reject("denied");

    wake(true);
    await flush();

    expect(io.connectCalls).toBe(2);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it("появление сети поднимает неактивный сокет", async () => {
    createTransport().initialize();
    io.reject("denied");

    online();
    await flush();

    expect(io.connectCalls).toBe(2);
  });

  it("не трогает сокет, который переподключается сам", async () => {
    createTransport().initialize();
    io.transportError();

    wake(true);
    online();
    await flush();

    expect(io.connectCalls).toBe(1);
  });

  it("auth:expired → отправляет свежий токен по живому соединению", async () => {
    createTransport().initialize();
    io.accept();

    io.fire("auth:expired", { graceMs: 30_000 });
    await flush();

    expect(provider.ensureFreshToken).toHaveBeenCalled();
    expect(io.emitted).toContainEqual({
      event: "auth:refresh",
      args: [{ accessToken: "fresh" }],
    });
  });

  it("новый токен сразу уходит серверу, пока соединение живо", () => {
    createTransport().initialize();
    io.accept();

    tokenListener("next");

    expect(io.emitted).toContainEqual({
      event: "auth:refresh",
      args: [{ accessToken: "next" }],
    });
  });

  it("новый токен без соединения не отправляется", () => {
    createTransport().initialize();

    tokenListener("next");

    expect(io.emitted.map(e => e.event)).not.toContain("auth:refresh");
  });

  it("disconnect останавливает повторы", async () => {
    const transport = createTransport();

    transport.initialize();
    io.reject("denied");
    transport.disconnect();

    await jest.advanceTimersByTimeAsync(30_000);
    wake(true);
    await flush();

    expect(io.connectCalls).toBe(1);
    expect(transport.state.status).toBe("disconnected");
  });

  it("connect после disconnect создаёт новый сокет", async () => {
    const transport = createTransport();

    transport.initialize();
    transport.disconnect();

    const connecting = transport.connect();

    io.accept();

    await expect(connecting).resolves.toBeUndefined();
    expect(connectMock).toHaveBeenCalledTimes(2);
  });

  it("очередь emit отправляется после подключения", () => {
    const transport = createTransport();

    transport.initialize();
    transport.emit("hello", 1);

    expect(io.emitted).toEqual([]);

    io.accept();

    expect(io.emitted).toContainEqual({ event: "hello", args: [1] });
  });
  it("возвращение приложения проверяет живое соединение пингом", async () => {
    createTransport().initialize();
    io.accept();

    wake(true);

    expect(io.emitted.map(e => e.event)).toContain("ping");

    io.fire("pong");
    await jest.advanceTimersByTimeAsync(10_000);

    expect(io.connectCalls).toBe(1);
  });

  it("без ответа на пинг переподключается тем же сокетом", async () => {
    const transport = createTransport();

    transport.initialize();
    io.accept();

    wake(true);
    await jest.advanceTimersByTimeAsync(5_000);

    expect(io.connectCalls).toBe(2);
    expect(io.active).toBe(true);
    expect(connectMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(30_000);

    expect(provider.refreshToken).not.toHaveBeenCalled();
  });

  describe("фон", () => {
    it("через 30 с в фоне отключается, не пересоздавая сокет и подписчиков", async () => {
      const transport = createTransport();
      const handler = jest.fn();

      transport.initialize();
      transport.on("ping:any", handler);
      io.accept();
      setAppActive(false);

      await jest.advanceTimersByTimeAsync(29_000);
      expect(io.connected).toBe(true);

      await jest.advanceTimersByTimeAsync(1_000);
      expect(io.connected).toBe(false);
      expect(transport.state.status).toBe("disconnected");

      // В фоне не переподключается сам.
      await jest.advanceTimersByTimeAsync(60_000);
      expect(io.connectCalls).toBe(1);

      setAppActive(true);
      await flush();
      expect(io.connectCalls).toBe(2);
      expect(connectMock).toHaveBeenCalledTimes(1);

      io.accept();
      io.fire("ping:any");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("короткий уход в фон — без отключения", async () => {
      const transport = createTransport();

      transport.initialize();
      io.accept();
      setAppActive(false);
      await jest.advanceTimersByTimeAsync(10_000);
      setAppActive(true);
      io.fire("pong");
      // Отложенное отключение отменено: на 32-й секунде с ухода в фон сокет
      // жив (до таймаута очередного пинга, 35 с, — чтобы его не задеть).
      await jest.advanceTimersByTimeAsync(22_000);

      expect(io.connectCalls).toBe(1);
      expect(transport.state.status).not.toBe("disconnected");
    });

    it("появление сети в фоне не поднимает сокет", async () => {
      createTransport().initialize();
      io.reject("denied");
      setAppActive(false);

      online();
      await flush();

      expect(io.connectCalls).toBe(1);
    });
  });
});
