import type { IStorageService } from "@shared/lib/storage";

import type { ITokenStorage, TokenPair } from "../session.types";

export interface PersistentTokenStorageOptions {
  /** Ключ refresh-токена. */
  key: string;
  /** Ключ access-токена. Без него access не сохраняется, что безопаснее. */
  accessKey?: string;
}

/** Токены переживают перезапуск: лежат в key-value хранилище приложения. */
export class PersistentTokenStorage implements ITokenStorage {
  constructor(
    private readonly _storage: IStorageService,
    private readonly _options: PersistentTokenStorageOptions,
  ) {}

  read(): TokenPair | null {
    const refreshToken = this._storage.getItem(this._options.key) ?? "";
    const accessKey = this._options.accessKey;
    const accessToken = accessKey
      ? (this._storage.getItem(accessKey) ?? "")
      : "";

    if (!refreshToken && !accessToken) return null;

    return { accessToken, refreshToken };
  }

  write(tokens: TokenPair): void {
    this._put(this._options.key, tokens.refreshToken);

    if (this._options.accessKey) {
      this._put(this._options.accessKey, tokens.accessToken);
    }
  }

  clear(): void {
    this._storage.removeItem(this._options.key);

    if (this._options.accessKey) {
      this._storage.removeItem(this._options.accessKey);
    }
  }

  private _put(key: string, value: string): void {
    if (value) {
      this._storage.setItem(key, value);
    } else {
      this._storage.removeItem(key);
    }
  }
}
