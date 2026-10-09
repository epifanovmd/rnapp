import { configuredWorkers } from "@entities/agent";
import {
  type IWorkerConfigTarget,
  useWorkerConfigEditorVM,
} from "@features/edit-worker-config";
import { IMainApi } from "@shared/api";
import type {
  AgentConfigStatusDto,
  AgentDto,
  IAgentConfigEntryDto,
} from "@shared/api/gen/main/model";
import { useCollection } from "@shared/lib/holders";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";

/** Ключи настроек одного воркера. */
export interface IWorkerConfigGroup {
  worker: string;
  /** Воркер не прислал манифест: ключи и схемы неизвестны. */
  noManifest: boolean;
  items: IWorkerConfigTarget[];
}

/** Статус события `agent:config`: агент удалил ключ. */
const CONFIG_DELETED = "deleted";

const entryKey = (entry: { worker: string; key: string }) =>
  `${entry.worker}/${entry.key}`;

/**
 * Настройки воркеров агента: ключи из манифестов вместе с заданными на
 * сервере значениями и статусом применения; статус обновляется событием
 * `agent:config`, удалённый агентом ключ пропадает. Ключ не из манифеста тоже
 * показывается — его можно удалить. Значения и правка — только с правом на
 * настройки.
 */
export const useAgentConfigsVM = (agent: AgentDto, canConfig: boolean) => {
  const api = IMainApi.useInstance();
  const entries = useCollection<IAgentConfigEntryDto, string>({
    queryFn: id => api.getAgentConfigs(id),
    keyExtractor: entryKey,
    watch: [agent.id],
  });

  useSocketRoom("agent", agent.id, () => entries.refresh(agent.id));
  useSocketEvent<[AgentConfigStatusDto]>("agent:config", status => {
    if (status.agentId !== agent.id) return;
    if (status.state === CONFIG_DELETED) {
      entries.removeItem(entryKey(status));

      return;
    }

    const current = entries.items.find(
      entry => entryKey(entry) === entryKey(status),
    );

    if (current) entries.upsertItem(entryKey(status), { ...current, status });
    else entries.refresh(agent.id);
  });

  const editor = useWorkerConfigEditorVM({
    onSaved: entry => entries.upsertItem(entryKey(entry), entry),
    onDeleted: () => entries.refresh(agent.id),
  });

  const entryOf = (worker: string, key: string) =>
    entries.items.find(entry => entry.worker === worker && entry.key === key) ??
    null;

  const groups: IWorkerConfigGroup[] = configuredWorkers(agent).map(worker => {
    const declared = worker.manifest?.configs ?? [];
    const declaredKeys = new Set(declared.map(config => config.key));
    const extra = entries.items.filter(
      entry => entry.worker === worker.name && !declaredKeys.has(entry.key),
    );

    return {
      worker: worker.name,
      noManifest: !worker.manifest,
      items: [
        ...declared.map(config => ({
          agentId: agent.id,
          worker: worker.name,
          key: config.key,
          manifest: config,
          entry: entryOf(worker.name, config.key),
        })),
        ...extra.map(entry => ({
          agentId: agent.id,
          worker: worker.name,
          key: entry.key,
          manifest: null,
          entry,
        })),
      ],
    };
  });

  return {
    groups,
    isLoading: entries.isLoading,
    error: entries.error,
    reload: () => entries.refresh(agent.id),
    editor,
    canConfig,
  };
};

export type AgentConfigsVM = ReturnType<typeof useAgentConfigsVM>;
