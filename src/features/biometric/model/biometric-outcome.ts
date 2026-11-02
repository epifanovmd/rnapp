/** Срок жизни nonce на сервере. */
export const NONCE_TTL_MS = 5 * 60 * 1000;

/** Запас на сеть: подпись, отправленная впритык к сроку, могла опоздать. */
const NONCE_SAFETY_MS = 10 * 1000;

/** Ключа нет (iOS) или он аннулирован сменой отпечатков (Android). */
const KEY_INVALID_PATTERN = /key not found|invalidated/i;

/** Датчик заблокирован после неудачных попыток. */
const LOCKOUT_PATTERN =
  /locked ?out|lockout|too many attempts|слишком много попыток/i;

/** Итог неудачной попытки: тост и нужно ли забыть регистрацию устройства. */
export interface IBiometricOutcome {
  level: "info" | "warning" | "error";
  message: string;
  /** Сбросить локальную регистрацию и удалить ключ с устройства. */
  reset: boolean;
}

/** Ошибка API в объёме, нужном для разбора. */
export interface IBiometricApiFailure {
  status?: number;
  message: string;
}

/** Отказ биометрического запроса: отмена пользователем или ошибка модуля. */
export interface IBiometricPromptFailure {
  canceled: boolean;
  message?: string;
}

/** Ключ устройства больше не действует: регистрация сбрасывается. */
export const keyMissingOutcome = (label: string): IBiometricOutcome => ({
  level: "error",
  message: `Вход по ${label} больше не действует. Войдите по паролю и включите его заново в настройках.`,
  reset: true,
});

/** Разбор отказа биометрического запроса; `silentCancel` — отмена без тоста. */
export const resolvePromptFailure = (
  label: string,
  failure: IBiometricPromptFailure,
  silentCancel = false,
): IBiometricOutcome | null => {
  if (failure.canceled) {
    return silentCancel
      ? null
      : { level: "info", message: `Вход по ${label} отменён`, reset: false };
  }

  const message = failure.message ?? "";

  if (KEY_INVALID_PATTERN.test(message)) return keyMissingOutcome(label);

  if (LOCKOUT_PATTERN.test(message)) {
    return {
      level: "error",
      message:
        "Датчик заблокирован после неудачных попыток. Разблокируйте устройство кодом и попробуйте снова.",
      reset: false,
    };
  }

  return {
    level: "error",
    message: `Не удалось подтвердить вход по ${label}`,
    reset: false,
  };
};

/**
 * Разбор ошибки `verify-signature`. Сервер на любой провал отвечает одним 401:
 * если nonce к этому времени истёк — просим повторить, иначе ключ отозван
 * (устройство или аккаунт удалены). Сеть, таймаут и 5xx показал HTTP-клиент.
 */
export const resolveVerifyFailure = (
  label: string,
  error: IBiometricApiFailure,
  elapsedMs: number,
): IBiometricOutcome | null => {
  if (error.status === undefined || error.status >= 500) return null;

  if (error.status === 401) {
    return elapsedMs >= NONCE_TTL_MS - NONCE_SAFETY_MS
      ? {
          level: "warning",
          message: "Время на подтверждение истекло. Попробуйте ещё раз.",
          reset: false,
        }
      : keyMissingOutcome(label);
  }

  return { level: "error", message: error.message, reset: false };
};

/** Разбор отзыва устройства на сервере: 404 — устройства уже нет, это успех. */
export const resolveDisableFailure = (
  label: string,
  error: IBiometricApiFailure | undefined,
): IBiometricOutcome | null => {
  if (!error || error.status === 404) return null;

  return {
    level: "warning",
    message: `Вход по ${label} выключен на устройстве, но сервер не подтвердил отзыв ключа`,
    reset: true,
  };
};
