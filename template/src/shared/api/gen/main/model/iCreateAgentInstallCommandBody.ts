import type { ICreateAgentInstallCommandBodyKillMode } from "./iCreateAgentInstallCommandBodyKillMode";
import type { RecordStringString } from "./recordStringString";

/**
 * Параметры команды установки агента на узел (флаги `install.sh`).
 */
export interface ICreateAgentInstallCommandBody {
  /** Токен регистрации; ровно одно из `token` и `tokenFile`. */
  token?: string;
  /** Путь к файлу с токеном на узле. */
  tokenFile?: string;
  /** Адрес сервера; без него — `AGENT_PUBLIC_URL` или `APP_PUBLIC_URL`. */
  baseUrl?: string;
  name?: string;
  /** Пользователь службы агента. */
  user?: string;
  /** Путь к `agent.yaml` на узле. */
  config?: string;
  privileged?: boolean;
  /** `process` | `mixed`. */
  killMode?: ICreateAgentInstallCommandBodyKillMode;
  packages?: string[];
  sysctl?: RecordStringString;
  rwPaths?: string[];
  caFile?: string;
  /** Воркеры с сервера. */
  workers?: string[];
  /** Например `30s`. */
  stopTimeout?: string;
  /** Другой источник сборок воркеров (`--releases`). */
  releases?: string;
}
