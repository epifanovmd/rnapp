import type { NodeDto } from "@shared/api/gen/main/model";
import type { AccessScope } from "@shared/lib/access";
import {
  ISocketTransport,
  useSocketEvent,
  useSocketRoom,
} from "@shared/lib/socket";
import { useEffect } from "react";

import { INodeLoadEvent, INodesStore } from "./types";

/**
 * Изменения и нагрузка узлов в сторе. С правом на все узлы — комната
 * `nodes`; свои узлы сервер присылает лично владельцу и создателю, поэтому
 * события слушаются при любой области. После переподключения (не первого
 * подключения) список перечитывается при любой области.
 */
export const useNodesRealtime = (scope: AccessScope | null): void => {
  const store = INodesStore.useInstance();
  const socket = ISocketTransport.useInstance();
  const enabled = scope !== null;

  useSocketRoom("nodes", scope === "all" ? "all" : null, () => {
    store.load();
  });
  // Без комнаты (свои узлы) пересинхронизация — по самому переподключению.
  useEffect(() => {
    if (scope !== "own") return;

    let connected = socket.state.status === "connected";

    return socket.onConnect(() => {
      if (connected) store.load();
      connected = true;
    });
  }, [scope, socket, store]);
  useSocketEvent<[NodeDto]>("node:updated", store.upsert, enabled);
  useSocketEvent<[{ id: string }]>(
    "node:deleted",
    ({ id }) => store.remove(id),
    enabled,
  );
  useSocketEvent<[INodeLoadEvent]>("node:load", store.applyLoad, enabled);
};
