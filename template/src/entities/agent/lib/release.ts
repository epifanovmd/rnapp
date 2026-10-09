import type {
  AgentDto,
  IAgentReleaseDto,
  IAgentUpdateCandidateDto,
  IAgentWorkerUpdateCandidateDto,
} from "@shared/api/gen/main/model";

/**
 * Кандидат на обновление агента до новой версии. Сборки могли устареть:
 * агент уже на этой версии — кандидата нет.
 */
export const agentUpdateCandidate = (
  release: IAgentReleaseDto | null,
  agentId: string,
  agent?: Pick<AgentDto, "version">,
): IAgentUpdateCandidateDto | null => {
  const candidate = release?.candidates.find(item => item.agentId === agentId);

  if (!candidate || agent?.version === candidate.target) return null;

  return candidate;
};

/** Кандидат на обновление воркера сборкой с сервера; воркер уже на этой версии — нет. */
export const workerUpdateCandidate = (
  release: IAgentReleaseDto | null,
  agentId: string,
  worker: string,
  current?: string,
): IAgentWorkerUpdateCandidateDto | null => {
  const candidate = release?.workerCandidates.find(
    item => item.agentId === agentId && item.worker === worker,
  );

  if (!candidate || current === candidate.target) return null;

  return candidate;
};

/** Воркеры с сервера по имени без повторов (сборки под разные платформы). */
export const releaseWorkerNames = (
  release: IAgentReleaseDto | null,
): string[] =>
  [
    ...new Set(release?.manifest?.workers?.map(worker => worker.name) ?? []),
  ].sort();

/** Событие `agent:release`: там, откуда берутся сборки, другая версия агента. */
export interface IAgentReleaseNotice {
  version: string;
  /** Прежняя версия; нет — сборки получены впервые после запуска сервера. */
  previous?: string;
  /** Откуда берутся сборки: `github:owner/repo` (GitHub Releases) или ссылка на каталог. */
  from: string;
}

/**
 * Текст уведомления о новой версии агента; первое получение сборок после
 * запуска сервера (без прежней версии) — без уведомления.
 */
export const agentReleaseMessage = (
  notice: IAgentReleaseNotice,
): string | null =>
  notice.previous && notice.previous !== notice.version
    ? `Доступна версия агента ${notice.version} (была ${notice.previous})`
    : null;
