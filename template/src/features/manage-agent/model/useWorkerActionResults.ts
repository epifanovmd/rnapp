import { type IAgentActionEvent, IAgentsStore } from "@entities/agent";
import { INotificationService } from "@shared/lib/notifications";
import { useSocketEvent } from "@shared/lib/socket";

import { workerActionNotice } from "./worker-action-result";

/**
 * Итоги отложенных замен воркеров агента (`agent:action` с `deferred`):
 * уведомление, снятие ожидания и свежая карточка агента. Сокет должен быть в
 * комнате агента — её держит экран.
 */
export const useWorkerActionResults = (agentId: string | null): void => {
  const store = IAgentsStore.useInstance();
  const toast = INotificationService.useInstance();

  useSocketEvent<[IAgentActionEvent]>(
    "agent:action",
    event => {
      const tracked = workerActionNotice(event, agentId)
        ? store.settleDeferred(event.id)
        : undefined;
      const notice = workerActionNotice(event, agentId, tracked?.worker);

      if (!notice) return;

      if (notice.ok) toast.success(notice.message);
      else toast.error(notice.message, { title: notice.title });
      store.fetch(event.agentId);
    },
    !!agentId,
  );
};
