import type { AgentAlertDto, AgentDto } from "@shared/api/gen/main/model";
import { useNotifications } from "@shared/lib/notifications";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";

import { agentReleaseMessage, type IAgentReleaseNotice } from "../lib/release";
import { IAgentsStore } from "./types";

/**
 * Комната `agents`: изменения агентов, их проблем и выпуска попадают в стор.
 * Новая версия агента в источнике выпусков (`agent:release`) — выпуск
 * перечитывается и показывается уведомление (одно на версию). После
 * переподключения список, проблемы и выпуск перечитываются.
 */
export const useAgentsRealtime = (enabled: boolean): void => {
  const store = IAgentsStore.useInstance();
  const toast = useNotifications();

  useSocketRoom("agents", enabled ? "all" : null, () => {
    store.load();
    store.loadAlerts();
    store.loadRelease();
  });
  useSocketEvent<[AgentDto]>("agent:updated", store.upsert, enabled);
  useSocketEvent<[{ id: string }]>(
    "agent:deleted",
    ({ id }) => store.remove(id),
    enabled,
  );
  useSocketEvent<[AgentAlertDto]>("agent:alert", store.applyAlert, enabled);
  useSocketEvent<[IAgentReleaseNotice]>(
    "agent:release",
    notice => {
      store.loadRelease();

      const message = agentReleaseMessage(notice);

      if (message)
        toast.info(message, { key: `agent-release-${notice.version}` });
    },
    enabled,
  );
};
