import { IStorageService } from "@shared/lib/storage";

/** Сохранённая позиция списка. */
export interface ILabPosition {
  /** Ключ строки, стоявшей у верхней кромки. */
  key: string;
  /** Смещение этой строки относительно кромки. */
  offset: number;
}

const positionKey = (screen: string) => `listLab:${screen}:position`;
const RESTORE_ENABLED_KEY = "listLab:restoreEnabled";

const isPosition = (value: unknown): value is ILabPosition => {
  if (typeof value !== "object" || value === null) return false;

  const position = value as Partial<ILabPosition>;

  return (
    typeof position.key === "string" &&
    position.key.length > 0 &&
    typeof position.offset === "number" &&
    Number.isFinite(position.offset)
  );
};

export interface ILabPositionStorage {
  isRestoreEnabled(): boolean;
  setRestoreEnabled(enabled: boolean): void;
  read(screen: string): ILabPosition | undefined;
  write(screen: string, position: ILabPosition): void;
  clear(screen: string): void;
}

/**
 * Позиция списка между открытиями экрана.
 *
 * Пишется синхронно (MMKV): стартовая позиция нужна к первому рендеру, а не
 * после асинхронного чтения — иначе список успеет открыться сверху и дёрнется.
 */
export const createLabPositionStorage = (
  storage: IStorageService,
): ILabPositionStorage => ({
  isRestoreEnabled: () => storage.getItem(RESTORE_ENABLED_KEY) !== "false",

  setRestoreEnabled: enabled =>
    storage.setItem(RESTORE_ENABLED_KEY, String(enabled)),

  read: screen => {
    const raw = storage.getItem(positionKey(screen));

    if (!raw) return undefined;

    try {
      const parsed: unknown = JSON.parse(raw);

      // Запись переживает обновления приложения — сломанная не должна ронять экран.
      return isPosition(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  },

  write: (screen, position) =>
    storage.setItem(positionKey(screen), JSON.stringify(position)),

  clear: screen => storage.removeItem(positionKey(screen)),
});
