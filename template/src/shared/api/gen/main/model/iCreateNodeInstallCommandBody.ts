/**
 * Команда установки агента на узел вручную.
 */
export interface ICreateNodeInstallCommandBody {
  /** Адрес сервера для агента; без него — `AGENT_PUBLIC_URL` / `APP_PUBLIC_URL`. */
  baseUrl?: string;
  /** Срок одноразового токена, минут (по умолчанию сутки). */
  expiresInMinutes?: number;
  /** Воркеры из выпуска агента (по умолчанию — проверка сети `netprobe`). */
  workers?: string[];
}
