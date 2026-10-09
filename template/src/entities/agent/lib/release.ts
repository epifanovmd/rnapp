import type {
  AgentDto,
  IAgentReleaseDto,
  IAgentUpdateCandidateDto,
  IAgentWorkerUpdateCandidateDto,
} from "@shared/api/gen/main/model";

/**
 * Кандидат на обновление агента до версии выпуска. Выпуск мог устареть:
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

/** Кандидат на обновление воркера из выпуска; воркер уже на этой версии — нет. */
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

/** Воркеры выпуска по имени без повторов (сборки под разные платформы). */
export const releaseWorkerNames = (
  release: IAgentReleaseDto | null,
): string[] =>
  [
    ...new Set(release?.manifest?.workers?.map(worker => worker.name) ?? []),
  ].sort();

/** Событие `agent:release`: в источнике выпусков другая версия агента. */
export interface IAgentReleaseNotice {
  version: string;
  /** Прежняя версия; нет — выпуск получен впервые после запуска сервера. */
  previous?: string;
  /** `github:owner/repo` или ссылка на каталог выпуска. */
  from: string;
}

/**
 * Текст уведомления о новой версии агента; первое получение выпуска после
 * запуска сервера (без прежней версии) — без уведомления.
 */
export const agentReleaseMessage = (
  notice: IAgentReleaseNotice,
): string | null =>
  notice.previous && notice.previous !== notice.version
    ? `Доступна версия агента ${notice.version} (была ${notice.previous})`
    : null;
