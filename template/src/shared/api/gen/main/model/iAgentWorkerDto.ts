import type { IAgentWorkerHealthDto } from "./iAgentWorkerHealthDto";
import type { IAgentWorkerManifestDto } from "./iAgentWorkerManifestDto";
import type { RecordStringIAgentWorkerConfigReportDto } from "./recordStringIAgentWorkerConfigReportDto";

/**
 * Воркер агента: из `hello` и последнего `status`. `state` — `starting`,
 * `running` (зарегистрирован), `invalid` (не ответил как нужно на
 * `GET /health` или `GET /manifest`, причина — `message`), `backoff`,
 * `stopped`.
 */
export interface IAgentWorkerDto {
  name: string;
  state?: string;
  message?: string;
  version?: string;
  /** Ставится и обновляется из выпуска. */
  release?: boolean;
  /** Встроенный `sysmetrics`: часть агента. */
  builtin?: boolean;
  restarts?: number;
  health?: IAgentWorkerHealthDto;
  /** `restart` | `update` — замена ждёт, пока воркер занят. */
  pending?: string;
  manifest?: IAgentWorkerManifestDto;
  /** Ключ → что на диске агента и итог применения. */
  configs?: RecordStringIAgentWorkerConfigReportDto;
}
