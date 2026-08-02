import { IStorageService } from "@shared/lib/storage";
import { IChatScrollAnchor } from "@shared/ui/chat-view";

/**
 * Сохранение позиции чата между открытиями.
 *
 * Якорь пишется синхронно (MMKV) — иначе его нельзя было бы прочитать к первому
 * рендеру, а `initialScrollAnchor` читается ровно один раз, на монтировании.
 *
 * Ключи привязаны к чату: у каждого диалога своя позиция.
 */
const anchorKey = (chatId: string) => `chat:${chatId}:scrollAnchor`;

/** Включено ли восстановление — общий для всех чатов переключатель. */
const RESTORE_ENABLED_KEY = "chat:scrollRestoreEnabled";

const isAnchor = (value: unknown): value is IChatScrollAnchor => {
  if (typeof value !== "object" || value === null) return false;

  const anchor = value as Partial<IChatScrollAnchor>;

  return (
    typeof anchor.messageId === "string" &&
    anchor.messageId.length > 0 &&
    typeof anchor.offset === "number" &&
    Number.isFinite(anchor.offset) &&
    typeof anchor.wasAtBottom === "boolean"
  );
};

export interface IChatScrollStorage {
  isRestoreEnabled(): boolean;
  setRestoreEnabled(enabled: boolean): void;
  readAnchor(chatId: string): IChatScrollAnchor | undefined;
  writeAnchor(chatId: string, anchor: IChatScrollAnchor): void;
  clearAnchor(chatId: string): void;
}

export const createChatScrollStorage = (
  storage: IStorageService,
): IChatScrollStorage => ({
  // По умолчанию восстановление включено: это ожидаемое поведение мессенджера.
  isRestoreEnabled: () => storage.getItem(RESTORE_ENABLED_KEY) !== "false",

  setRestoreEnabled: enabled =>
    storage.setItem(RESTORE_ENABLED_KEY, String(enabled)),

  readAnchor: chatId => {
    const raw = storage.getItem(anchorKey(chatId));

    if (!raw) return undefined;

    try {
      const parsed: unknown = JSON.parse(raw);

      // Хранилище переживает обновления приложения, поэтому форму проверяем:
      // сломанная запись не должна ронять экран при открытии.
      return isAnchor(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  },

  writeAnchor: (chatId, anchor) =>
    storage.setItem(anchorKey(chatId), JSON.stringify(anchor)),

  clearAnchor: chatId => storage.removeItem(anchorKey(chatId)),
});
