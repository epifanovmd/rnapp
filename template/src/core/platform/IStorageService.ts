import { createServiceDecorator } from "@di";
import { createMMKV } from "react-native-mmkv";

/**
 * Абстракция key-value хранилища.
 * React Native: MMKV — синхронное высокопроизводительное хранилище.
 */
export interface IStorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const IStorageService = createServiceDecorator<IStorageService>();

@IStorageService({ inSingleton: true })
export class MmkvStorageService implements IStorageService {
  private readonly _storage = createMMKV();

  getItem(key: string): string | null {
    return this._storage.getString(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this._storage.set(key, value);
  }

  removeItem(key: string): void {
    this._storage.remove(key);
  }
}
