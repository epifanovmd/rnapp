import { injectable } from "inversify";
import { connect } from "socket.io-client";

import { SOCKET_BASE_URL } from "../../../config/env";
import { IAppStateService } from "../../app-state";
import { INetworkStatusService } from "../../network";
import { ITokenProvider } from "../contract";
import { EmitQueue } from "./emit-queue";
import { PersistentListeners } from "./persistent-listeners";
import { ReconnectScheduler } from "./reconnect-scheduler";
import {
  AppSocket,
  ISocketTransport,
  SocketStatusListener,
  SocketTransportState,
} from "./socket.transport.types";

/** Application-level heartbeat interval. */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Max time to wait for pong response. */
const HEARTBEAT_TIMEOUT_MS = 5_000;

const noop = () => {};

interface IPendingConnect {
  promise: Promise<void>;
  reject: (err: Error) => void;
}

/** Через сколько в фоне отключать сокет, мс. */
const BACKGROUND_SUSPEND_MS = 30_000;

/**
 * Одно долгоживущее соединение socket.io.
 *
 * - Токен запрашивается перед каждым handshake (`auth`-колбэк), поэтому
 *   встроенные повторы не уходят со старым токеном после фона.
 * - Сетевые обрывы переподключает сам socket.io. Когда он сдаётся — сервер
 *   отказал в подключении или разорвал его (`socket.active === false`), —
 *   транспорт обновляет токен и повторяет с backoff.
 * - Новый токен уходит по живому соединению (`auth:refresh`), в том числе
 *   в ответ на `auth:expired`, — сервер не рвёт соединение по сроку.
 * - Возвращение приложения и появление сети поднимают сдавшийся сокет сразу,
 *   а живой проверяют пингом: после фона соединение может оказаться мёртвым.
 */
@injectable()
export class SocketTransport implements ISocketTransport {
  private _socket: AppSocket | null = null;
  private _isManualDisconnect = false;
  /** Приостановлен в фоне: не переподключаться до возвращения приложения. */
  private _isSuspended = false;
  private _backgroundTimer: ReturnType<typeof setTimeout> | null = null;
  private _pending: IPendingConnect | null = null;

  private _statusListeners = new Set<SocketStatusListener>();
  private _persistentListeners = new PersistentListeners();
  private _emitQueue = new EmitQueue();

  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  private _state: SocketTransportState = { status: "idle", error: null };
  private _initializeDisposers: (() => void) | null = null;
  private _reconnect = new ReconnectScheduler();

  constructor(
    @ITokenProvider() private _tokenProvider: ITokenProvider,
    @IAppStateService() private _appState: IAppStateService,
    @INetworkStatusService() private _network: INetworkStatusService,
  ) {}

  get state(): SocketTransportState {
    return this._state;
  }

  initialize(): () => void {
    if (this._initializeDisposers) return this._initializeDisposers;

    const disposeToken = this._tokenProvider.onTokenChange(this._sendToken);
    const disposeAppActive = this._appState.onChange(isActive => {
      if (isActive) {
        this._cancelBackgroundSuspend();
        this._onWake();
      } else {
        this._scheduleBackgroundSuspend();
      }
    });
    const disposeNetworkOnline = this._network.onOnline(this._onWake);

    this.connect().catch(noop);

    const disposers = () => {
      disposeToken();
      disposeAppActive();
      disposeNetworkOnline();
      this._cancelBackgroundSuspend();
      this.disconnect();
      this._initializeDisposers = null;
    };

    this._initializeDisposers = disposers;

    return disposers;
  }

  connect(): Promise<void> {
    if (this._socket?.connected) return Promise.resolve();
    if (this._pending) return this._pending.promise;

    this._isManualDisconnect = false;
    this._isSuspended = false;

    const socket = this._socket ?? this._createSocket();
    const pending = {} as IPendingConnect;

    pending.promise = new Promise<void>((resolve, reject) => {
      const settle = () => {
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
        if (this._pending === pending) this._pending = null;
      };
      const onConnect = () => {
        settle();
        resolve();
      };
      const onError = (err: Error) => {
        settle();
        reject(err);
      };

      pending.reject = onError;
      socket.once("connect", onConnect);
      socket.once("connect_error", onError);
    });

    this._pending = pending;

    if (!socket.active) {
      this._setState({ status: "connecting", error: null });
      socket.connect();
    }

    return pending.promise;
  }

  disconnect(): void {
    this._isManualDisconnect = true;
    this._reconnect.reset();
    this._emitQueue.clear();
    this._persistentListeners.clear();
    this._pending?.reject(new Error("Socket disconnected"));
    this._teardown();
    this._setState({ status: "disconnected", error: null });
  }

  on<TArgs extends any[]>(
    event: string,
    handler: (...args: TArgs) => void,
  ): () => void {
    const removeFromStore = this._persistentListeners.add(event, handler);

    this._socket?.on(event, handler);

    return () => {
      removeFromStore();
      this._socket?.off(event, handler);
    };
  }

  emit<TArgs extends any[]>(event: string, ...args: TArgs): void {
    const doEmit = (socket: AppSocket) => socket.emit(event, ...args);

    if (this._socket?.connected) {
      doEmit(this._socket);
    } else {
      this._emitQueue.enqueue(socket => doEmit(socket));
    }
  }

  async emitWithAck<T = unknown>(
    event: string,
    data: unknown,
    opts: { timeoutMs?: number; maxRetries?: number } = {},
  ): Promise<T> {
    const { timeoutMs = 3_000, maxRetries = 3 } = opts;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (!this._socket?.connected) {
        try {
          await this._waitForConnect(timeoutMs);
        } catch {
          lastError = new Error(
            `[Socket] Not connected for '${event}' (attempt ${attempt + 1})`,
          );
          continue;
        }
      }

      try {
        return await this._emitWithTimeout<T>(event, data, timeoutMs);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt);

          await new Promise<void>(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new Error(`[Socket] emitWithAck '${event}' failed`);
  }

  onConnect(handler: () => void): () => void {
    return this.on("connect", handler);
  }

  onDisconnect(handler: (reason: string) => void): () => void {
    return this.on("disconnect", handler);
  }

  onStatusChange(listener: SocketStatusListener): () => void {
    this._statusListeners.add(listener);

    return () => this._statusListeners.delete(listener);
  }

  private _createSocket(): AppSocket {
    const socket: AppSocket = connect(SOCKET_BASE_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.3,
      transports: ["websocket"],
      timeout: 10_000,
      auth: this._provideAuth,
    });

    this._socket = socket;
    this._persistentListeners.bindTo(socket);

    socket.on("connect", this._onConnect);
    socket.on("connect_error", this._onConnectError);
    socket.on("disconnect", this._onDisconnect);
    socket.on("auth:expired", this._onAuthExpired);

    return socket;
  }

  private _teardown(): void {
    this._stopHeartbeat();
    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket.disconnect();
      this._socket = null;
    }
  }

  private _setState(partial: Partial<SocketTransportState>): void {
    this._state = { ...this._state, ...partial };
    this._statusListeners.forEach(l => l(this._state));
  }

  /** Данные handshake: socket.io вызывает перед каждой попыткой подключения. */
  private _provideAuth = (cb: (data: object) => void): void => {
    const provider = this._tokenProvider;

    provider
      .ensureFreshToken()
      .catch(noop)
      .then(() => {
        const token = provider.accessToken;

        cb(token ? { token } : {});
      });
  };

  /** Отдать серверу токен по живому соединению, чтобы тот продлил его срок. */
  private _sendToken = (token: string): void => {
    if (token && this._socket?.connected) {
      this._socket.emit("auth:refresh", { accessToken: token });
    }
  };

  /** Сокет, от которого socket.io отказался; живой или повторяющий не в счёт. */
  private _isAbandoned(): boolean {
    if (this._isManualDisconnect || !this._socket) return false;
    if (this._isSuspended) return true;

    return !this._socket.connected && !this._socket.active;
  }

  /**
   * Приложение вернулось или сеть появилась: брошенный сокет поднять сразу,
   * без ожидания backoff, а живой проверить пингом.
   */
  private _onWake = (): void => {
    // Сеть появилась, пока приложение в фоне, — поднимем по возвращении.
    if (!this._appState.isActive) return;

    if (this._socket?.connected) {
      this._sendHeartbeat();

      return;
    }

    if (!this._isAbandoned()) return;

    this._reconnect.reset();
    this.connect().catch(noop);
  };

  /**
   * Приложение ушло в фон: через `BACKGROUND_SUSPEND_MS` отключить сокет —
   * live-события в фоне не нужны и тратят батарею и трафик. Подписчики и
   * сокет сохраняются: по возвращении `_onWake` подключит его, комнаты
   * войдут заново и перечитают пропущенное (`onRejoin`).
   */
  private _scheduleBackgroundSuspend(): void {
    this._cancelBackgroundSuspend();
    this._backgroundTimer = setTimeout(() => {
      this._backgroundTimer = null;
      this._suspend();
    }, BACKGROUND_SUSPEND_MS);
  }

  private _cancelBackgroundSuspend(): void {
    if (this._backgroundTimer) clearTimeout(this._backgroundTimer);
    this._backgroundTimer = null;
  }

  private _suspend(): void {
    if (this._isManualDisconnect || !this._socket) return;

    this._isSuspended = true;
    this._reconnect.reset();
    this._stopHeartbeat();
    this._socket.disconnect();
    this._setState({ status: "disconnected", error: null });
  }

  /** socket.io сдался: обновить токен и повторить с backoff. */
  private _scheduleReconnect(): void {
    this._reconnect.schedule(() => {
      if (!this._isAbandoned()) return;

      this._tokenProvider
        .refreshToken()
        .catch(noop)
        .then(() => {
          if (this._isAbandoned()) this.connect().catch(noop);
        });
    });
  }

  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this._heartbeatTimer = setInterval(() => {
      this._sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private _stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    if (this._heartbeatTimeout) {
      clearTimeout(this._heartbeatTimeout);
      this._heartbeatTimeout = null;
    }
  }

  private _sendHeartbeat(): void {
    const socket = this._socket;

    if (!socket?.connected) return;
    if (this._heartbeatTimeout) return;

    const onPong = () => {
      if (this._heartbeatTimeout) {
        clearTimeout(this._heartbeatTimeout);
        this._heartbeatTimeout = null;
      }
    };

    socket.once("pong", onPong);
    socket.emit("ping", { ts: Date.now() });

    this._heartbeatTimeout = setTimeout(() => {
      this._heartbeatTimeout = null;
      socket.off("pong", onPong);
      this._restart(socket);
    }, HEARTBEAT_TIMEOUT_MS);
  }

  /**
   * Соединение мертво, а socket.io этого не заметил. После `disconnect()`
   * он сам не переподключается, поэтому сразу `connect()` тем же сокетом.
   */
  private _restart(socket: AppSocket): void {
    if (socket !== this._socket || this._isManualDisconnect) return;

    socket.disconnect();
    this.connect().catch(noop);
  }

  private _emitWithTimeout<T>(
    event: string,
    data: unknown,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this._socket?.connected) {
        reject(new Error("[Socket] Not connected"));

        return;
      }

      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`[Socket] Ack timeout for '${event}'`));
        }
      }, timeoutMs);

      (this._socket as any).emit(event, data, (response: T) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(response);
        }
      });
    });
  }

  private _waitForConnect(timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._socket?.connected) {
        resolve();

        return;
      }

      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          dispose();
          reject(
            new Error("[Socket] Connect timeout while waiting for ack retry"),
          );
        }
      }, timeoutMs);

      const dispose = this.onConnect(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          dispose();
          resolve();
        }
      });
    });
  }

  private _onConnect = (): void => {
    this._reconnect.reset();
    this._setState({ status: "connected", error: null });
    this._startHeartbeat();
    if (this._socket) {
      this._emitQueue.flush(this._socket);
    }
  };

  private _onDisconnect = (): void => {
    this._stopHeartbeat();
    if (this._isManualDisconnect || this._isSuspended) return;

    this._setState({ status: "connecting" });

    if (!this._socket?.active) this._scheduleReconnect();
  };

  private _onConnectError = (err: Error): void => {
    if (this._isManualDisconnect) return;

    this._setState({ status: "error", error: err });

    if (!this._socket?.active) this._scheduleReconnect();
  };

  private _onAuthExpired = (): void => {
    const provider = this._tokenProvider;

    provider
      .ensureFreshToken()
      .catch(noop)
      .then(() => this._sendToken(provider.accessToken));
  };
}
