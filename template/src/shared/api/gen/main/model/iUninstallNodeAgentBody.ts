/**
 * Удаление агента по SSH.
 */
export interface IUninstallNodeAgentBody {
  /** Хост SSH; без него — `host` узла. */
  host?: string;
  /** Порт SSH (по умолчанию 22). */
  port?: number;
  /** Пользователь SSH (по умолчанию root). */
  username?: string;
  /** Пароль SSH (и для sudo, если он требует пароль). */
  password?: string;
  /** Приватный ключ SSH (PEM). */
  privateKey?: string;
  /** Пароль приватного ключа. */
  passphrase?: string;
  /** Повышать права через sudo (по умолчанию — если пользователь не root). */
  sudo?: boolean;
  /**
   * Адрес сервера, доступный с узла: установщик и связь агента; без него —
   * `AGENT_PUBLIC_URL` / `APP_PUBLIC_URL`.
   */
  backendUrl?: string;
  /** Удалить и данные, конфигурацию, пакеты и пользователя службы. */
  purge?: boolean;
}
