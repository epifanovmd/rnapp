import { SOCKET_BASE_URL } from "@api";
import { IAuthSessionService, IAuthTokenStore } from "@core/auth";
import { reaction } from "mobx";
import { connect } from "socket.io-client";

import {
  SocketClientToServerEvents,
  SocketServerToClientEvents,
} from "../events";
import { EmitQueue } from "./emitQueue";
import { PersistentListeners } from "./persistentListeners";
import { ISocketPlatformBridge } from "./socketPlatformBridge.types";
import {
  AppSocket,
  ISocketTransport,
  SocketStatusListener,
  SocketTransportState,
} from "./socketTransport.types";

// ── Heartbeat constants ─────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = 30_000; // отправлять ping каждые 30 секунд
const HEARTBEAT_TIMEOUT_MS = 5_000; // ждать pong не более 5 секунд

@ISocketTransport({ inSingleton: true })
export class SocketTransport implements ISocketTransport {
  private _socket: AppSocket | null = null;
  private _isManualDisconnect = false;

  // Guards against concurrent connect() calls (e.g. visibilitychange + online
  // firing at the same time, or auth_error handler racing with a retry).
  private _connectingPromise: Promise<void> | null = null;

  private _statusListeners = new Set<SocketStatusListener>();
  private _persistentListeners = new PersistentListeners();
  private _emitQueue = new EmitQueue();

  // ── Heartbeat ───────────────────────────────────────────────────────
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  private _state: SocketTransportState = { status: "idle", error: null };

  constructor(
    @IAuthTokenStore() private _tokenStore: IAuthTokenStore,
    @IAuthSessionService() private _session: IAuthSessionService,
    @ISocketPlatformBridge() private _platform: ISocketPlatformBridge,
  ) {}

  get state(): SocketTransportState {
    return this._state;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  initialize(): () => void {
    const disposeTokenReaction = reaction(
      () => this._tokenStore.accessToken,
      token => {
        console.log("token", token);
        if (this._socket && token) {
          // Update both auth and query so the token is fresh on the next
          // reconnection attempt regardless of which mechanism the server reads.
          this._socket.auth = { token };
          (this._socket.io.opts.query as Record<string, string>).access_token =
            token;
        }
      },
    );

    const disposeAppActive = this._platform.onAppActive(() => {
      if (this._isManualDisconnect) return;

      if (!this._socket?.connected) {
        this.connect().catch(() => {});
      } else {
        // Вкладка/приложение стало активным — немедленно проверяем, что соединение живо
        this._sendHeartbeat();
      }
    });

    const disposeNetworkOnline = this._platform.onNetworkOnline(() => {
      if (!this._isManualDisconnect && !this._socket?.connected) {
        this.connect().catch(() => {});
      }
    });

    this.connect().catch(() => {});

    return () => {
      disposeTokenReaction();
      disposeAppActive();
      disposeNetworkOnline();
      this.disconnect();
    };
  }

  connect(): Promise<void> {
    if (this._socket?.connected) return Promise.resolve();
    if (this._connectingPromise) return this._connectingPromise;

    this._connectingPromise = this._doConnect().finally(() => {
      this._connectingPromise = null;
    });

    return this._connectingPromise;
  }

  disconnect(): void {
    this._isManualDisconnect = true;
    this._emitQueue.clear();
    this._persistentListeners.clear();
    this._teardown();
    this._setState({ status: "disconnected", error: null });
  }

  // ─── Pub/Sub ────────────────────────────────────────────────────────────────

  on<K extends keyof SocketServerToClientEvents>(
    event: K,
    handler: SocketServerToClientEvents[K],
  ): () => void {
    const removeFromStore = this._persistentListeners.add(
      event as string,
      handler,
    );

    this._socket?.on(event, handler as never);

    return () => {
      removeFromStore();
      this._socket?.off(event, handler as never);
    };
  }

  emit<K extends keyof SocketClientToServerEvents>(
    event: K,
    ...args: Parameters<SocketClientToServerEvents[K]>
  ): void {
    type EmitFn = (
      e: K,
      ...a: Parameters<SocketClientToServerEvents[K]>
    ) => void;

    const doEmit = (socket: AppSocket) =>
      (socket.emit as EmitFn)(event, ...args);

    if (this._socket?.connected) {
      doEmit(this._socket);
    } else {
      this._emitQueue.enqueue(socket => doEmit(socket));
    }
  }

  onConnect(handler: () => void): () => void {
    const removeFromStore = this._persistentListeners.add("connect", handler);

    this._socket?.on("connect", handler);

    return () => {
      removeFromStore();
      this._socket?.off("connect", handler);
    };
  }

  onDisconnect(handler: (reason: string) => void): () => void {
    const removeFromStore = this._persistentListeners.add(
      "disconnect",
      handler,
    );

    this._socket?.on("disconnect", handler as never);

    return () => {
      removeFromStore();
      this._socket?.off("disconnect", handler as never);
    };
  }

  onStatusChange(listener: SocketStatusListener): () => void {
    this._statusListeners.add(listener);

    return () => this._statusListeners.delete(listener);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _doConnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._teardown();

      const accessToken = this._tokenStore.accessToken;

      if (!accessToken) {
        const err = new Error("[Socket] No access token available");

        this._setState({ status: "error", error: err });
        reject(err);

        return;
      }

      this._isManualDisconnect = false;
      this._setState({ status: "connecting", error: null });

      const socket: AppSocket = connect(SOCKET_BASE_URL, {
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 30_000,
        transports: ["websocket"],
        timeout: 10_000,
        auth: { token: accessToken },
        query: { access_token: accessToken },
      });

      this._socket = socket;

      // Re-attach all handlers (onConnect / onDisconnect / on) to the
      // fresh socket instance so nothing is lost after teardown.
      this._persistentListeners.bindTo(socket);

      // One-shot handlers that settle the Promise.
      const onFirstConnect = () => {
        socket.off("connect_error", onFirstError);
        resolve();
      };
      const onFirstError = (err: Error) => {
        socket.off("connect", onFirstConnect);
        this._setState({ status: "error", error: err });
        reject(err);
      };

      socket.once("connect", onFirstConnect);
      socket.once("connect_error", onFirstError);

      // Internal lifecycle handlers (not user-facing, registered every time).
      socket.on("connect", this._onConnect);
      socket.on("connect_error", this._onConnectError);
      socket.on("disconnect", this._onDisconnect);
      socket.on("auth_error", this._onAuthError);

      socket.connect();
    });
  }

  private _teardown(): void {
    this._stopHeartbeat();
    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket.disconnect();
      this._socket = null;
    }
  }

  // ── Heartbeat ───────────────────────────────────────────────────────

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
    if (!this._socket?.connected) return;
    if (this._heartbeatTimeout) return; // уже ждём ответа

    const ts = Date.now();

    const onPong = () => {
      if (this._heartbeatTimeout) {
        clearTimeout(this._heartbeatTimeout);
        this._heartbeatTimeout = null;
      }
    };

    this._socket.once("pong", onPong);
    this._socket.emit("ping", { ts });

    this._heartbeatTimeout = setTimeout(() => {
      this._heartbeatTimeout = null;
      this._socket?.off("pong", onPong);

      console.warn("[Socket] Heartbeat timeout — forcing reconnect");
      // Соединение мертво, но Socket.IO этого не знает.
      // Принудительно разрываем и даём встроенному reconnection переподключиться.
      this._socket?.disconnect();
    }, HEARTBEAT_TIMEOUT_MS);
  }

  private _setState(partial: Partial<SocketTransportState>): void {
    this._state = { ...this._state, ...partial };
    this._statusListeners.forEach(l => l(this._state));
  }

  private _onConnect = (): void => {
    this._setState({ status: "connected", error: null });
    this._startHeartbeat();
    if (this._socket) {
      this._emitQueue.flush(this._socket);
    }
  };

  private _onDisconnect = (reason: string): void => {
    this._stopHeartbeat();
    if (this._isManualDisconnect) return;

    this._setState({ status: "disconnected" });

    // socket.io handles most disconnect reasons internally (transport error,
    // ping timeout, etc.) via built-in reconnection.
    // "io server disconnect" is the only case where the server intentionally
    // closes the connection and socket.io will NOT retry on its own.
    if (reason === "io server disconnect") {
      this._session
        .refreshToken()
        .then(() => this.connect())
        .catch(err => this._setState({ status: "error", error: err }));
    }
  };

  private _onConnectError = (err: Error): void => {
    console.error("[Socket] Connection error:", err.message);
    this._setState({ status: "error", error: err });
  };

  private _onAuthError = ({ message }: { message: string }): void => {
    console.warn("[Socket] Auth error:", message);
    this._session
      .restoreSession()
      .then(() => this.connect())
      .catch(err => this._setState({ status: "error", error: err }));
  };
}
