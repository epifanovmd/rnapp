import { createServiceDecorator } from "@di";

import type {
  ISocketPresenceInitPayload,
  ISocketUserPresencePayload,
} from "../../socket/events/types";

export const IPresenceStore = createServiceDecorator<IPresenceStore>();

export interface IPresenceEntry {
  online: boolean;
  lastOnline: string | null;
}

export interface IPresenceStore {
  /** Проверить, онлайн ли пользователь */
  isOnline(userId: string): boolean;

  /** Получить lastOnline для пользователя */
  getLastOnline(userId: string): string | null;

  /** Получить полную запись о присутствии */
  getPresence(userId: string): IPresenceEntry;

  /** Обработчик начальной синхронизации presence */
  handlePresenceInit(payload: ISocketPresenceInitPayload): void;

  /** Обработчик события user:online */
  handleUserOnline(payload: ISocketUserPresencePayload): void;

  /** Обработчик события user:offline */
  handleUserOffline(payload: ISocketUserPresencePayload): void;

  /** Очистить все данные (при logout) */
  clear(): void;
}
