import { action, makeAutoObservable, observable } from "mobx";

import type {
  ISocketPresenceInitPayload,
  ISocketUserPresencePayload,
} from "../../socket/events/types";
import { type IPresenceEntry, IPresenceStore } from "./PresenceStore.types";

const OFFLINE_ENTRY: IPresenceEntry = { online: false, lastOnline: null };

@IPresenceStore({ inSingleton: true })
export class PresenceStore implements IPresenceStore {
  /** userId → { online, lastOnline } */
  private _map = observable.map<string, IPresenceEntry>();

  constructor() {
    makeAutoObservable(
      this,
      {
        handlePresenceInit: action,
        handleUserOnline: action,
        handleUserOffline: action,
        clear: action,
      },
      { autoBind: true },
    );
  }

  isOnline(userId: string): boolean {
    return this._map.get(userId)?.online ?? false;
  }

  getLastOnline(userId: string): string | null {
    return this._map.get(userId)?.lastOnline ?? null;
  }

  getPresence(userId: string): IPresenceEntry {
    return this._map.get(userId) ?? OFFLINE_ENTRY;
  }

  handlePresenceInit(payload: ISocketPresenceInitPayload): void {
    // Сбросить предыдущее состояние и заполнить актуальным
    this._map.clear();
    for (const userId of payload.onlineUserIds) {
      this._map.set(userId, { online: true, lastOnline: null });
    }
  }

  handleUserOnline(payload: ISocketUserPresencePayload): void {
    this._map.set(payload.userId, {
      online: true,
      lastOnline: null,
    });
  }

  handleUserOffline(payload: ISocketUserPresencePayload): void {
    this._map.set(payload.userId, {
      online: false,
      lastOnline: payload.lastOnline ?? null,
    });
  }

  clear(): void {
    this._map.clear();
  }
}
