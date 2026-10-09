import { IAgentsStore } from "@entities/agent";
import { IMainApi } from "@shared/api";
import type {
  AgentDto,
  IAgentWorkerActionResultDto,
  IAgentWorkerDto,
} from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useConfirm } from "@shared/ui";
import { useState } from "react";

type TWorkerAction = "restart" | "update";

const isBusyWorker = (worker: IAgentWorkerDto): boolean =>
  !!worker.health?.busy;

/**
 * Действия с воркером агента: перезапуск и обновление сборкой с сервера. Свободный
 * воркер заменяется сразу; занятый — после окончания работы: ответ приходит
 * сразу (`deferred`), строка показывает ожидание, итог — событием
 * `agent:action` (`useWorkerActionResults`). «Заменить сейчас» (`force`) —
 * сразу, прерывая работу.
 */
export const useWorkerActions = () => {
  const api = IMainApi.useInstance();
  const store = IAgentsStore.useInstance();
  const toast = INotificationService.useInstance();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string[]>([]);

  const send = async (
    action: TWorkerAction,
    agent: AgentDto,
    worker: IAgentWorkerDto,
    request: () => Promise<{
      data?: IAgentWorkerActionResultDto;
      error?: unknown;
    }>,
  ): Promise<IAgentWorkerActionResultDto | null> => {
    const key = `${action}:${worker.name}`;

    setBusy(prev => [...prev, key]);

    const res = await request();

    setBusy(prev => prev.filter(item => item !== key));
    if (res.error || !res.data) {
      notifyApiError(toast, res.error);

      return null;
    }
    if (res.data.deferred && res.data.actionId) {
      store.trackDeferred({
        actionId: res.data.actionId,
        agentId: agent.id,
        worker: worker.name,
        pending: res.data.pending ?? action,
      });
      toast.info(
        `Воркер «${worker.name}» занят — агент заменит его, когда освободится`,
      );

      return null;
    }

    return res.data;
  };

  const restart = async (
    agent: AgentDto,
    worker: IAgentWorkerDto,
    force = false,
  ) => {
    const ok = await confirm({
      title: force
        ? `Перезапустить воркер «${worker.name}» сейчас?`
        : `Перезапустить воркер «${worker.name}»?`,
      description: force
        ? "Агент остановит воркер, не дожидаясь окончания работы, и запустит заново."
        : isBusyWorker(worker)
          ? "Воркер занят: агент перезапустит его, когда работа закончится."
          : "Агент остановит воркер и запустит заново.",
      confirmLabel: "Перезапустить",
      confirmVariant: force ? "destructive" : undefined,
    });

    if (!ok) return;

    const res = await send("restart", agent, worker, () =>
      api.restartAgentWorker(agent.id, worker.name, { force }),
    );

    if (res) toast.success(`Воркер «${worker.name}» перезапущен`);
  };

  const update = async (
    agent: AgentDto,
    worker: IAgentWorkerDto,
    target: string | null,
    force = false,
  ) => {
    const ok = await confirm({
      title: target
        ? `Обновить воркер «${worker.name}» до версии ${target}?`
        : `Обновить воркер «${worker.name}» сейчас?`,
      description: [
        worker.version && `Сейчас — ${worker.version}.`,
        "Агент скачает сборку с сервера и заменит воркер; не заработает — вернёт прежнюю.",
        force
          ? "Работа воркера прервётся."
          : isBusyWorker(worker) &&
            "Воркер занят: замена — когда работа закончится.",
      ]
        .filter(Boolean)
        .join(" "),
      confirmLabel: "Обновить",
      confirmVariant: force ? "destructive" : undefined,
    });

    if (!ok) return;

    const res = await send("update", agent, worker, () =>
      api.updateAgentWorker(agent.id, worker.name, { force }),
    );

    if (res) {
      toast.success(
        res.version
          ? `Воркер «${worker.name}» работает на версии ${res.version}`
          : `Воркер «${worker.name}» обновлён`,
      );
    }
  };

  /** Заменить сейчас: отложенное обновление или перезапуск — без ожидания. */
  const replaceNow = (
    agent: AgentDto,
    worker: IAgentWorkerDto,
    target: string | null,
  ) => {
    const pending =
      worker.pending ?? store.deferredOf(agent.id, worker.name)?.pending;

    return pending === "update"
      ? update(agent, worker, target, true)
      : restart(agent, worker, true);
  };

  return {
    restart,
    update,
    replaceNow,
    /** Идёт ли это действие с воркером. */
    isBusy: (action: TWorkerAction, worker: string) =>
      busy.includes(`${action}:${worker}`),
  };
};

export type WorkerActions = ReturnType<typeof useWorkerActions>;
