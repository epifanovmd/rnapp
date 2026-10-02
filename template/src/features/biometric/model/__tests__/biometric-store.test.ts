import type { IAuthStore } from "@entities/auth";
import type { IUserStore } from "@entities/user";
import type { IMainApi } from "@shared/api";
import { HttpError, NetworkError } from "@shared/lib/http";
import type { INotificationService } from "@shared/lib/notifications";
import type { IStorageService } from "@shared/lib/storage";

import { BIOMETRIC_STORAGE_KEY } from "../biometric-enrollment";
import { BiometricStore } from "../store";
import type { IBiometricDevice } from "../types";

// Декораторы DI из барелей — без нативных модулей RN.
jest.mock("@entities/auth", () => ({ IAuthStore: () => () => undefined }));
jest.mock("@entities/user", () => ({ IUserStore: () => () => undefined }));
jest.mock("@shared/lib/notifications", () => ({
  INotificationService: () => () => undefined,
}));

const ENROLLMENT = { userId: "u1", deviceId: "d1" };
const TOKENS = { accessToken: "a", refreshToken: "r" };

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
    getAllKeys: () => Array.from(map.keys()),
  };
};

const createDevice = (
  overrides: Partial<IBiometricDevice> = {},
): jest.Mocked<IBiometricDevice> =>
  ({
    getSensor: jest
      .fn()
      .mockResolvedValue({ available: true, biometryType: "FaceID" }),
    confirmPresence: jest.fn().mockResolvedValue(null),
    sign: jest.fn().mockResolvedValue({ signature: "sig" }),
    createKey: jest.fn().mockResolvedValue("pub"),
    keyExists: jest.fn().mockResolvedValue(true),
    deleteKey: jest.fn().mockResolvedValue(undefined),
    getIdentity: jest
      .fn()
      .mockResolvedValue({ deviceId: "d1", deviceName: "iPhone" }),
    readLegacyUserId: jest.fn().mockResolvedValue(null),
    clearLegacyUserId: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as jest.Mocked<IBiometricDevice>;

const createNotifications = () =>
  ({
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  }) as unknown as jest.Mocked<INotificationService>;

interface ISetup {
  api?: Partial<IMainApi>;
  device?: Partial<IBiometricDevice>;
  userId?: string | null;
  enrolled?: boolean;
}

const setup = ({
  api = {},
  device,
  userId = "u1",
  enrolled = true,
}: ISetup = {}) => {
  const storage = createStorage();

  if (enrolled) {
    storage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(ENROLLMENT));
  }

  const authStore = { restore: jest.fn().mockResolvedValue(undefined) };
  const notifications = createNotifications();
  const nativeDevice = createDevice(device);
  const mainApi = {
    generateNonce: jest.fn().mockResolvedValue({ data: { nonce: "n1" } }),
    verifySignature: jest
      .fn()
      .mockResolvedValue({ data: { verified: true, tokens: TOKENS } }),
    registerBiometric: jest
      .fn()
      .mockResolvedValue({ data: { registered: true } }),
    deleteDevice: jest.fn().mockResolvedValue({ data: undefined }),
    getDevices: jest
      .fn()
      .mockResolvedValue({ data: { devices: [{ deviceId: "d1" }] } }),
    ...api,
  };
  const store = new BiometricStore(
    mainApi as unknown as IMainApi,
    authStore as unknown as IAuthStore,
    { user: userId ? { id: userId } : null } as unknown as IUserStore,
    storage,
    notifications,
    nativeDevice,
  );

  return {
    store,
    storage,
    authStore,
    notifications,
    device: nativeDevice,
    api: mainApi,
  };
};

describe("BiometricStore.load", () => {
  it("читает регистрацию и датчик", async () => {
    const { store } = setup();

    await store.load();

    expect(store.isSupported).toBe(true);
    expect(store.label).toBe("Face ID");
    expect(store.canSignIn).toBe(true);
    expect(store.isEnabled).toBe(true);
  });

  it("переносит регистрацию из AsyncStorage (biometricUserId) в хранилище", async () => {
    const { store, storage, device } = setup({
      enrolled: false,
      device: { readLegacyUserId: jest.fn().mockResolvedValue("u1") },
    });

    await store.load();

    expect(JSON.parse(storage.getItem(BIOMETRIC_STORAGE_KEY)!)).toEqual(
      ENROLLMENT,
    );
    expect(device.clearLegacyUserId).toHaveBeenCalled();
    expect(store.canSignIn).toBe(true);
  });
});

describe("BiometricStore.isEnabled", () => {
  it("включено только для пользователя, который включал", async () => {
    const { store } = setup({ userId: "u2" });

    await store.load();

    expect(store.isEnabled).toBe(false);
    expect(store.canSignIn).toBe(true);
  });
});

describe("BiometricStore.signIn", () => {
  it("nonce → подпись → вход; публичные вызовы без bearer-авторизации", async () => {
    const { store, api, authStore, device } = setup();

    await store.signIn();

    expect(api.generateNonce).toHaveBeenCalledWith(ENROLLMENT, {
      auth: false,
    });
    expect(device.sign).toHaveBeenCalledWith(expect.any(String), "n1");
    expect(api.verifySignature).toHaveBeenCalledWith(
      { ...ENROLLMENT, nonce: "n1", signature: "sig" },
      { auth: false },
    );
    expect(authStore.restore).toHaveBeenCalledWith(TOKENS);
  });

  it("сетевая ошибка verify — регистрация остаётся, тоста «отключена» нет", async () => {
    const { store, storage, device, notifications } = setup({
      api: {
        verifySignature: jest
          .fn()
          .mockResolvedValue({ error: new NetworkError() }),
      },
    });

    await store.signIn();

    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).not.toBeNull();
    expect(device.deleteKey).not.toHaveBeenCalled();
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it("401 verify — ключ отозван: регистрация и ключ удаляются, тост об ошибке", async () => {
    const { store, storage, device, notifications } = setup({
      api: {
        verifySignature: jest.fn().mockResolvedValue({
          error: new HttpError({ status: 401, message: "fail" }),
        }),
      },
    });

    await store.signIn();

    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).toBeNull();
    expect(device.deleteKey).toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalled();
    expect(store.canSignIn).toBe(false);
  });

  it("повторный вызов во время входа игнорируется — один nonce", async () => {
    const { store, api } = setup();

    await Promise.all([store.signIn(), store.signIn()]);

    expect(api.generateNonce).toHaveBeenCalledTimes(1);
  });

  it("отмена автозапроса — молча", async () => {
    const { store, notifications, api } = setup({
      device: {
        sign: jest.fn().mockResolvedValue({ failure: { canceled: true } }),
      },
    });

    await store.signIn({ auto: true });

    expect(api.verifySignature).not.toHaveBeenCalled();
    expect(notifications.info).not.toHaveBeenCalled();
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it("ключа на устройстве нет — регистрация сбрасывается без запроса nonce", async () => {
    const { store, storage, api } = setup({
      device: { keyExists: jest.fn().mockResolvedValue(false) },
    });

    await store.signIn();

    expect(api.generateNonce).not.toHaveBeenCalled();
    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).toBeNull();
  });
});

describe("BiometricStore.enable", () => {
  it("биометрический запрос до создания ключа, затем регистрация", async () => {
    const { store, device, api, storage } = setup({ enrolled: false });

    await store.enable();

    expect(device.confirmPresence).toHaveBeenCalled();
    expect(device.confirmPresence.mock.invocationCallOrder[0]).toBeLessThan(
      device.createKey.mock.invocationCallOrder[0],
    );
    expect(api.registerBiometric).toHaveBeenCalledWith({
      deviceId: "d1",
      deviceName: "iPhone",
      publicKey: "pub",
    });
    expect(JSON.parse(storage.getItem(BIOMETRIC_STORAGE_KEY)!)).toEqual(
      ENROLLMENT,
    );
    expect(store.isEnabled).toBe(true);
  });

  it("отмена запроса — ключ не создаётся", async () => {
    const { store, device } = setup({
      enrolled: false,
      device: {
        confirmPresence: jest.fn().mockResolvedValue({ canceled: true }),
      },
    });

    await store.enable();

    expect(device.createKey).not.toHaveBeenCalled();
  });

  it("сервер отказал — ключ удаляется, прежняя регистрация сбрасывается", async () => {
    const { store, device, storage } = setup({
      userId: "u2",
      api: {
        registerBiometric: jest.fn().mockResolvedValue({
          error: new HttpError({ status: 409, message: "Лимит" }),
        }),
      },
    });

    await store.enable();

    expect(device.deleteKey).toHaveBeenCalled();
    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).toBeNull();
    expect(store.isEnabled).toBe(false);
  });
});

describe("BiometricStore.disable", () => {
  it("отзыв на сервере и удаление ключа", async () => {
    const { store, api, device, storage } = setup();

    await store.disable();

    expect(api.deleteDevice).toHaveBeenCalledWith("d1", {
      notifyErrors: false,
    });
    expect(device.deleteKey).toHaveBeenCalled();
    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).toBeNull();
  });

  it("404 — успех", async () => {
    const { store, notifications } = setup({
      api: {
        deleteDevice: jest.fn().mockResolvedValue({
          error: new HttpError({ status: 404, message: "нет" }),
        }),
      },
    });

    await store.disable();

    expect(notifications.success).toHaveBeenCalled();
    expect(notifications.warning).not.toHaveBeenCalled();
  });
});

describe("BiometricStore.sync", () => {
  it("устройства нет на сервере — регистрация сбрасывается", async () => {
    const { store, storage } = setup({
      api: {
        getDevices: jest.fn().mockResolvedValue({ data: { devices: [] } }),
      },
    });

    await store.sync();

    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).toBeNull();
  });

  it("ключа на устройстве нет — сброс и отзыв на сервере", async () => {
    const { store, storage, api } = setup({
      device: { keyExists: jest.fn().mockResolvedValue(false) },
    });

    await store.sync();

    expect(api.deleteDevice).toHaveBeenCalledWith("d1", {
      notifyErrors: false,
    });
    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).toBeNull();
  });

  it("ошибка списка — регистрация остаётся", async () => {
    const { store, storage } = setup({
      api: {
        getDevices: jest.fn().mockResolvedValue({ error: new NetworkError() }),
      },
    });

    await store.sync();

    expect(storage.getItem(BIOMETRIC_STORAGE_KEY)).not.toBeNull();
  });

  it("чужая регистрация — сервер не спрашиваем", async () => {
    const { store, api } = setup({ userId: "u2" });

    await store.sync();

    expect(api.getDevices).not.toHaveBeenCalled();
  });
});
