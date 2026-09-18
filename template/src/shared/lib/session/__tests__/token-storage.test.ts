import type { IStorageService } from "@shared/lib/storage";

import { MemoryTokenStorage } from "../storage/memory-token-storage";
import { PersistentTokenStorage } from "../storage/persistent-token-storage";

const createStorage = (): IStorageService => {
  const map = new Map<string, string>();

  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: key => {
      map.delete(key);
    },
    getAllKeys: () => [...map.keys()],
  };
};

const tokens = { accessToken: "a", refreshToken: "r" };

describe("MemoryTokenStorage", () => {
  it("хранит пару до clear", () => {
    const storage = new MemoryTokenStorage();

    expect(storage.read()).toBeNull();
    storage.write(tokens);
    expect(storage.read()).toEqual(tokens);
    storage.clear();
    expect(storage.read()).toBeNull();
  });
});

describe("PersistentTokenStorage", () => {
  it("по умолчанию сохраняет только refresh-токен", () => {
    const backing = createStorage();
    const storage = new PersistentTokenStorage(backing, { key: "refresh" });

    storage.write(tokens);

    expect(backing.getAllKeys()).toEqual(["refresh"]);
    expect(storage.read()).toEqual({ accessToken: "", refreshToken: "r" });
  });

  it("с accessKey сохраняет оба токена", () => {
    const backing = createStorage();
    const storage = new PersistentTokenStorage(backing, {
      key: "refresh",
      accessKey: "access",
    });

    storage.write(tokens);

    expect(storage.read()).toEqual(tokens);
  });

  it("пустой токен удаляет ключ, а не пишет пустую строку", () => {
    const backing = createStorage();
    const storage = new PersistentTokenStorage(backing, {
      key: "refresh",
      accessKey: "access",
    });

    storage.write(tokens);
    storage.write({ accessToken: "", refreshToken: "" });

    expect(backing.getAllKeys()).toEqual([]);
    expect(storage.read()).toBeNull();
  });

  it("clear удаляет оба ключа", () => {
    const backing = createStorage();
    const storage = new PersistentTokenStorage(backing, {
      key: "refresh",
      accessKey: "access",
    });

    storage.write(tokens);
    storage.clear();

    expect(backing.getAllKeys()).toEqual([]);
  });
});
