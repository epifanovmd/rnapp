import type { ITokenStorage, TokenPair } from "../session.types";

/** Токены живут до перезапуска приложения. */
export class MemoryTokenStorage implements ITokenStorage {
  private _tokens: TokenPair | null = null;

  read(): TokenPair | null {
    return this._tokens;
  }

  write(tokens: TokenPair): void {
    this._tokens = tokens;
  }

  clear(): void {
    this._tokens = null;
  }
}
