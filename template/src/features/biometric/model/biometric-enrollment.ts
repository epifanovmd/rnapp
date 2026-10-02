import type { IStorageService } from "@shared/lib/storage";

/** Ключ хранилища: для кого и с каким идентификатором устройства зарегистрирован ключ. */
export const BIOMETRIC_STORAGE_KEY = "app:biometric";

/** Регистрация ключа устройства на сервере. */
export interface IBiometricEnrollment {
  userId: string;
  deviceId: string;
}

type TEnrollmentStorage = Pick<
  IStorageService,
  "getItem" | "setItem" | "removeItem"
>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/** Разбор сохранённой регистрации; битое значение — `null`. */
export const parseEnrollment = (
  raw: string | null,
): IBiometricEnrollment | null => {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);

    if (typeof value !== "object" || value === null) return null;

    const { userId, deviceId } = value as Record<string, unknown>;

    return isNonEmptyString(userId) && isNonEmptyString(deviceId)
      ? { userId, deviceId }
      : null;
  } catch {
    return null;
  }
};

export const readEnrollment = (storage: TEnrollmentStorage) =>
  parseEnrollment(storage.getItem(BIOMETRIC_STORAGE_KEY));

export const writeEnrollment = (
  storage: TEnrollmentStorage,
  enrollment: IBiometricEnrollment,
) => storage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(enrollment));

export const clearEnrollment = (storage: TEnrollmentStorage) =>
  storage.removeItem(BIOMETRIC_STORAGE_KEY);

/** Вход по биометрии включён этим пользователем на этом устройстве. */
export const isEnabledFor = (
  enrollment: IBiometricEnrollment | null,
  userId: string | undefined,
) => !!enrollment && !!userId && enrollment.userId === userId;

/** Устройство есть в списке сервера; иначе ключ отозван. */
export const isDeviceRegistered = (
  devices: ReadonlyArray<{ deviceId: string }>,
  deviceId: string,
) => devices.some(device => device.deviceId === deviceId);
