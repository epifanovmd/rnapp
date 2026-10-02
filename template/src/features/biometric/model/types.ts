import { createInjectDecorator } from "@shared/lib/di";
import type { TIconName } from "@shared/ui";

import type { IBiometricEnrollment } from "./biometric-enrollment";
import type { IBiometricPromptFailure } from "./biometric-outcome";

/** Датчик устройства: доступен ли и какого типа. */
export interface IBiometricSensor {
  available: boolean;
  biometryType?: string;
}

export type TBiometricSignature =
  { signature: string } | { failure: IBiometricPromptFailure };

/** Нативная часть: датчик, ключ устройства (RSA 2048) и данные устройства. */
export interface IBiometricDevice {
  getSensor(): Promise<IBiometricSensor>;
  /** Биометрический запрос без ключа; `null` — подтверждено. */
  confirmPresence(
    promptMessage: string,
  ): Promise<IBiometricPromptFailure | null>;
  /** Подпись RSA-SHA256 с биометрическим запросом, base64. */
  sign(promptMessage: string, payload: string): Promise<TBiometricSignature>;
  /** Новая пара ключей взамен прежней; публичный — SPKI DER в base64. */
  createKey(): Promise<string>;
  keyExists(): Promise<boolean>;
  deleteKey(): Promise<void>;
  getIdentity(): Promise<{ deviceId: string; deviceName: string }>;
  /** userId регистрации из прежнего хранилища (AsyncStorage). */
  readLegacyUserId(): Promise<string | null>;
  clearLegacyUserId(): Promise<void>;
}

export const IBiometricDevice =
  createInjectDecorator<IBiometricDevice>("IBiometricDevice");

/**
 * Вход по биометрии — общее состояние для меню, кнопки входа и бутстрапа:
 * ключ устройства регистрируется на сервере, вход — подпись одноразового nonce.
 */
export interface IBiometricStore {
  /** Датчик проверен, регистрация прочитана. */
  readonly isLoaded: boolean;
  /** Датчик есть и настроен. */
  readonly isSupported: boolean;
  /** Face ID / Touch ID / отпечатку — для подписей «Вход по …». */
  readonly label: string;
  readonly icon: TIconName;
  readonly enrollment: IBiometricEnrollment | null;
  /** Включено текущим пользователем на этом устройстве. */
  readonly isEnabled: boolean;
  /** На экране входа можно войти по биометрии. */
  readonly canSignIn: boolean;
  /** Идёт вход, включение или выключение. */
  readonly isBusy: boolean;

  /** Проверить датчик и прочитать регистрацию (с переносом из AsyncStorage). */
  load(): Promise<void>;
  /** Вход: nonce → подпись → токены. `auto` — автозапрос на старте, без тостов об отмене. */
  signIn(options?: { auto?: boolean }): Promise<void>;
  /** Включить для текущего пользователя. */
  enable(): Promise<void>;
  /** Выключить: отзыв на сервере и удаление ключа. */
  disable(): Promise<void>;
  /** Сверка с сервером: устройство отозвано или ключа нет — регистрация сбрасывается. */
  sync(): Promise<void>;
}

export const IBiometricStore =
  createInjectDecorator<IBiometricStore>("IBiometricStore");
