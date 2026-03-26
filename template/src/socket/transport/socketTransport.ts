import { SOCKET_BASE_URL } from "@api";
import { IAuthSessionService, IAuthTokenStore } from "@core/auth";
import { reaction } from "mobx";
import { AppState, AppStateStatus } from "react-native";
import { connect } from "socket.io-client";

import {
  SocketClientToServerEvents,
  SocketServerToClientEvents,
} from "../events";
import { EmitQueue } from "./emitQueue";
import { PersistentListeners } from "./persistentListeners";
import {
  AppSocket,
  ISocketTransport,
  SocketStatusListener,
  SocketTransportState,
} from "./socketTransport.types";

@ISocketTransport({ inSingleton: true })
export class SocketTransport implements ISocketTransport {
  private _socket: AppSocket | null = null;
  private _isManualDisconnect = false;

  // Guards against concurrent connect() calls
  private _connectingPromise: Promise<void> | null = null;

  private _statusListeners = new Set<SocketStatusListener>();
  private _persistentListeners = new PersistentListeners();
  private _emitQueue = new EmitQueue();

  private _state: SocketTransportState = { status: "idle", error: null };

  constructor(
    @IAuthTokenStore() private _tokenStore: IAuthTokenStore,
    @IAuthSessionService() private _session: IAuthSessionService,
  ) {}

  get state(): SocketTransportState {
    return this._state;
  }

  // --- Lifecycle -----------------------------------------------------------

  initialize(): () => void {
    // React to token changes to keep socket auth up-to-date
    const disposeTokenReaction = reaction(
      () => this._tokenStore.accessToken,
      token => {
        if (this._socket && token) {
          this._socket.auth = { token };
          (this._socket.io.opts.query as Record<string, string>).access_token =
            token;
        }
      },
    );

    // React Native: reconnect when app comes back to foreground
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        nextState === "active" &&
        !this._isManualDisconnect &&
        !this._socket?.connected
      ) {
        this.connect().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    this.connect().catch(() => {});

    return () => {
      disposeTokenReaction();
      subscription.remove();
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

  // --- Pub/Sub -------------------------------------------------------------

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

  // --- Private -------------------------------------------------------------

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
      }) as AppSocket;

      this._socket = socket;

      // Re-attach all handlers to the fresh socket instance
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
      socket.on("auth_error" as any, this._onAuthError);

      socket.connect();
    });
  }

  private _teardown(): void {
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

  private _onConnect = (): void => {
    this._setState({ status: "connected", error: null });
    if (this._socket) {
      this._emitQueue.flush(this._socket);
    }
  };

  private _onDisconnect = (reason: string): void => {
    if (this._isManualDisconnect) return;

    this._setState({ status: "disconnected" });

    // "io server disconnect" is the only case where socket.io will NOT retry
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
