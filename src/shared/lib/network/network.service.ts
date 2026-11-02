import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { injectable } from "inversify";

import { INetworkStatusService } from "./network.types";

/** Есть ли интернет; `null` — NetInfo ещё не знает. Captive portal — офлайн. */
const toOnline = ({
  isConnected,
  isInternetReachable,
}: Pick<NetInfoState, "isConnected" | "isInternetReachable">):
  boolean | null => {
  if (isConnected === null) return null;

  return isConnected && isInternetReachable !== false;
};

/**
 * Статус сети поверх NetInfo. Как `online`/`offline` в браузере, колбэки
 * срабатывают только на переходах: повторные и неизвестные состояния
 * отбрасываются.
 */
@injectable()
export class NetworkStatusService implements INetworkStatusService {
  private _isOnline: boolean | null = null;
  private readonly _onlineListeners = new Set<() => void>();
  private readonly _offlineListeners = new Set<() => void>();

  constructor() {
    NetInfo.addEventListener(state => this._update(toOnline(state)));
  }

  get isOnline(): boolean {
    return this._isOnline ?? true;
  }

  onOnline(callback: () => void): () => void {
    this._onlineListeners.add(callback);

    return () => this._onlineListeners.delete(callback);
  }

  onOffline(callback: () => void): () => void {
    this._offlineListeners.add(callback);

    return () => this._offlineListeners.delete(callback);
  }

  private _update(next: boolean | null): void {
    if (next === null || next === this._isOnline) return;

    const isFirst = this._isOnline === null;

    this._isOnline = next;

    if (isFirst) return;

    const listeners = next ? this._onlineListeners : this._offlineListeners;

    listeners.forEach(listener => listener());
  }
}
