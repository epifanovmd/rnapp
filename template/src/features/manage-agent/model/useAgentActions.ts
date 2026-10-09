import { agentVersion, IAgentsStore } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type { AgentDto } from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useConfirm } from "@shared/ui";
import { useState } from "react";

type TAgentAction = "revoke" | "remove" | "rotate" | "update";

/** Итог обновления приходит после запуска новой версии: ждём без срока. */
const NO_TIMEOUT = { timeout: 0 };

interface IUseAgentActionsOptions {
  /** Агент удалён (например, уйти с экрана агента). */
  onDeleted?: (agent: AgentDto) => void;
}

/**
 * Действия с агентом: отзыв, удаление, смена ключа и обновление — с
 * подтверждением. Смена ключа и обновление ждут итога от агента.
 */
export const useAgentActions = ({
  onDeleted,
}: IUseAgentActionsOptions = {}) => {
  const api = IMainApi.useInstance();
  const toast = INotificationService.useInstance();
  const store = IAgentsStore.useInstance();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string[]>([]);

  const run = async <T>(
    action: TAgentAction,
    agent: Pick<AgentDto, "id">,
    request: () => Promise<{ data?: T | null; error?: unknown }>,
  ): Promise<{ ok: boolean; data: T | null }> => {
    const key = `${action}:${agent.id}`;

    setBusy(prev => [...prev, key]);

    const res = await request();

    setBusy(prev => prev.filter(item => item !== key));
    if (res.error) {
      notifyApiError(toast, res.error);

      return { ok: false, data: null };
    }

    return { ok: true, data: res.data ?? null };
  };

  const revoke = async (agent: AgentDto) => {
    const ok = await confirm({
      title: `Отозвать агента «${agent.name}»?`,
      description:
        "Связь с агентом закроется, его ключ перестанет приниматься. Вернуть агента можно только новой регистрацией.",
      confirmLabel: "Отозвать",
      confirmVariant: "destructive",
    });

    if (!ok) return;

    const res = await run("revoke", agent, () => api.revokeAgent(agent.id));

    if (res.data) store.upsert(res.data);
    if (res.ok) toast.success(`Агент «${agent.name}» отозван`);
  };

  const remove = async (agent: AgentDto) => {
    const ok = await confirm({
      title: `Удалить агента «${agent.name}»?`,
      description:
        "Агент пропадёт из списка вместе с настройками воркеров, событиями и историей метрик.",
      confirmLabel: "Удалить",
      confirmVariant: "destructive",
    });

    if (!ok) return;

    const res = await run("remove", agent, () => api.deleteAgent(agent.id));

    if (!res.ok) return;
    store.remove(agent.id);
    toast.success(`Агент «${agent.name}» удалён`);
    onDeleted?.(agent);
  };

  const rotateKey = async (agent: AgentDto) => {
    const ok = await confirm({
      title: `Сменить ключ агента «${agent.name}»?`,
      description:
        "Агент создаст новый секрет и переподключится с ним. Переустанавливать агента не нужно, воркеры не перезапускаются.",
      confirmLabel: "Сменить ключ",
    });

    if (!ok) return;

    const res = await run("rotate", agent, () => api.rotateAgentKey(agent.id));

    if (res.ok) toast.success(`Ключ агента «${agent.name}» сменён`);
  };

  /** `target` — версия выпуска; неизвестна (нет права на выпуск) — `null`. */
  const update = async (
    agent: Pick<AgentDto, "id" | "name" | "version">,
    target: string | null,
  ) => {
    const current = agentVersion(agent);
    const ok = await confirm({
      title: target
        ? `Обновить агента «${agent.name}» до версии ${target}?`
        : `Обновить агента «${agent.name}» до новой версии?`,
      description: `${current ? `Сейчас — ${current}. ` : ""}Агент скачает новую программу с сервера, проверит подпись и перезапустится; воркеры продолжат работу.`,
      confirmLabel: "Обновить",
    });

    if (!ok) return;

    toast.info(`Агент «${agent.name}» обновляется`);

    const res = await run("update", agent, () =>
      api.updateAgent(agent.id, NO_TIMEOUT),
    );

    if (res.data) {
      toast.success(
        `Агент «${agent.name}» работает на версии ${res.data.version}`,
      );
    }
  };

  return {
    revoke,
    remove,
    rotateKey,
    update,
    /** Идёт ли это действие с агентом. */
    isBusy: (action: TAgentAction, agentId: string) =>
      busy.includes(`${action}:${agentId}`),
  };
};

export type AgentActions = ReturnType<typeof useAgentActions>;
