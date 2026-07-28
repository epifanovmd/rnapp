import { createInjectDecorator } from "@shared/lib/di";

/**
 * Абстракция key-value хранилища.
 * React Native: MMKV — синхронное высокопроизводительное хранилище.
 */
export interface IStorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  getAllKeys(): string[];
}

export const IStorageService = createInjectDecorator<IStorageService>();
