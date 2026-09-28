import { injectable } from "inversify";
import { connect } from "socket.io-client";

import { SOCKET_BASE_URL } from "../../../config/env";
import { IAppStateService } from "../../app-state";
import { INetworkStatusService } from "../../network";
import { ITokenProvider } from "../contract";
import { EmitQueue } from "./emit-queue";
import { PersistentListeners } from "./persistent-listeners";
import {
  AppSocket,
  ISocketTransport,
  SocketStatusListener,
  SocketTransportState,
} from "./socket.transport.types";

// ── Constants ───────────────────────────────────────────────────────

/** Application-level heartbeat interval. */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Max time to wait for pong response. */
const HEARTBEAT_TIMEOUT_MS = 5_000;

/** Max consecutive auth errors before circuit breaker trips. */
const AUTH_ERROR_MAX_RETRIES = 3;

/** Cooldown after circuit breaker trips (ms). */
const AUTH_CIRCUIT_BREAKER_COOLDOWN_MS = 60_000;

/** Min delay between connect attempts from platform triggers (ms). */
const CONNECT_THROTTLE_MS = 2_000;

// ── Transport ───────────────────────────────────────────────────────

@injectable()
export class SocketTransport implements ISocketTransport {
  private _socket: AppSocket | null = null;
  private _isManualDisconnect = false;

  // Guards against concurrent connect() calls
  private _connectingPromise: Promise<void> | null = null;

  private _statusListeners = new Set<SocketStatusListener>();
  private _persistentListeners = new PersistentListeners();
  private _emitQueue = new EmitQueue();

  // ── Heartbeat ──────────────────────────────────────────────────
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Auth circuit breaker ───────────────────────────────────────
  private _authErrorCount = 0;
  private _authCircuitOpen = false;
  private _authCooldownTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Connect throttle ──────────────────────────────────────────
  private _lastConnectAttempt = 0;

  private _state: SocketTransportState = { status: "idle", error: null };

  constructor(
    @ITokenProvider() private _tokenProvider: ITokenProvider,
    @IAppStateService() private _appState: IAppStateService,
    @INetworkStatusService() private _network: INetworkStatusService,
  ) {}

  get state(): SocketTransportState {
    return this._state;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────

  initialize(): () => void {
    const disposeTokenChange = this._tokenProvider.onTokenChange(token => {
      if (this._socket && token) {
        this._socket.auth = { token };
        (this._socket.io.opts.query as Record<string, string>).access_token =
          token;
      }
    });

    const disposeAppActive = this._appState.onChange(isActive => {
      if (this._isManualDisconnect || !isActive) return;

      if (!this._socket?.connected) {
        this._throttledConnect();
      } else {
        this._sendHeartbeat();
      }
    });

    const disposeNetworkOnline = this._network.onOnline(() => {
      if (!this._isManualDisconnect && !this._socket?.connected) {
        this._throttledConnect();
      }
    });

    this.connect().catch(() => {});

    return () => {
      disposeTokenChange();
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
    this._clearAuthCircuitBreaker();
    this._setState({ status: "disconnected", error: null });
  }

  // ─── Pub/Sub ──────────────────────────────────────────────────────

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

  // ─── Private: Connection ──────────────────────────────────────────

  private _doConnect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._teardown();

      const accessToken = this._tokenProvider.accessToken;

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
        reconnectionDelay: 2_000,
        reconnectionDelayMax: 30_000,
        randomizationFactor: 0.3, // jitter: ±30% на reconnection delay
        transports: ["websocket"],
        timeout: 10_000,
        auth: { token: accessToken },
        query: { access_token: accessToken },
      });

      this._socket = socket;

      this._persistentListeners.bindTo(socket);

      // One-shot handlers that settle the Promise
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

      // Internal lifecycle handlers
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

  /** Throttle: prevent rapid-fire connect attempts from platform triggers. */
  private _throttledConnect(): void {
    const now = Date.now();

    if (now - this._lastConnectAttempt < CONNECT_THROTTLE_MS) return;

    this._lastConnectAttempt = now;
    this.connect().catch(() => {});
  }

  // ─── Private: Heartbeat ───────────────────────────────────────────

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
    if (this._heartbeatTimeout) return;

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
      // Соединение мертво — принудительно разрываем,
      // socket.io reconnection переподключит автоматически.
      this._socket?.disconnect();
    }, HEARTBEAT_TIMEOUT_MS);
  }

  // ─── Private: Auth Circuit Breaker ────────────────────────────────

  /**
   * Предотвращает бесконечный цикл auth_error → restoreSession → connect → auth_error.
   * После AUTH_ERROR_MAX_RETRIES подряд — cooldown 60s.
   */
  private _handleAuthError(message: string): void {
    if (this._authCircuitOpen) return;

    this._authErrorCount++;

    if (this._authErrorCount >= AUTH_ERROR_MAX_RETRIES) {
      this._authCircuitOpen = true;
      this._setState({
        status: "error",
        error: new Error(`[Socket] Auth circuit breaker: ${message}`),
      });

      this._authCooldownTimer = setTimeout(() => {
        this._authCircuitOpen = false;
        this._authErrorCount = 0;
        this._authCooldownTimer = null;
        // Одна попытка после cooldown
        this._tokenProvider
          .restoreSession()
          .then(() => this.connect())
          .catch(() => {});
      }, AUTH_CIRCUIT_BREAKER_COOLDOWN_MS);

      return;
    }

    this._tokenProvider
      .restoreSession()
      .then(() => this.connect())
      .catch(err => this._setState({ status: "error", error: err }));
  }

  private _clearAuthCircuitBreaker(): void {
    this._authErrorCount = 0;
    this._authCircuitOpen = false;
    if (this._authCooldownTimer) {
      clearTimeout(this._authCooldownTimer);
      this._authCooldownTimer = null;
    }
  }

  // ─── Private: emitWithAck helpers ─────────────────────────────────

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

  // ─── Private: State & Handlers ────────────────────────────────────

  private _setState(partial: Partial<SocketTransportState>): void {
    this._state = { ...this._state, ...partial };
    this._statusListeners.forEach(l => l(this._state));
  }

  private _onConnect = (): void => {
    this._setState({ status: "connected", error: null });
    this._authErrorCount = 0; // Reset auth error counter on successful connect
    this._startHeartbeat();
    if (this._socket) {
      this._emitQueue.flush(this._socket);
    }
  };

  private _onDisconnect = (reason: string): void => {
    this._stopHeartbeat();
    if (this._isManualDisconnect) return;

    this._setState({ status: "disconnected" });

    // "io server disconnect" — server intentionally closed, socket.io won't retry
    if (reason === "io server disconnect") {
      this._tokenProvider
        .refreshToken()
        .then(() => this.connect())
        .catch(err => this._setState({ status: "error", error: err }));
    }
    // All other reasons: socket.io built-in reconnection handles automatically
  };

  private _onConnectError = (err: Error): void => {
    this._setState({ status: "error", error: err });
  };

  private _onAuthError = ({ message }: { message: string }): void => {
    this._handleAuthError(message);
  };
}
