import { injectable } from "inversify";
import { createMMKV } from "react-native-mmkv";

import { IStorageService } from "./storage.types";

@injectable()
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

  getAllKeys(): string[] {
    return this._storage.getAllKeys();
  }
}
