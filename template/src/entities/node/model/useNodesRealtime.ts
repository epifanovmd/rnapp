import type { NodeDto } from "@shared/api/gen/main/model";
import type { AccessScope } from "@shared/lib/access";
import { useSocketEvent, useSocketRoom } from "@shared/lib/socket";

import { INodeLoadEvent, INodesStore } from "./types";

/**
 * Изменения и нагрузка узлов в сторе. С правом на все узлы — комната
 * `nodes`; свои узлы сервер присылает лично владельцу и создателю, поэтому
 * события слушаются при любой области. После переподключения список
 * перечитывается.
 */
export const useNodesRealtime = (scope: AccessScope | null): void => {
  const store = INodesStore.useInstance();
  const enabled = scope !== null;

  useSocketRoom("nodes", scope === "all" ? "all" : null, () => {
    store.load();
  });
  useSocketEvent<[NodeDto]>("node:updated", store.upsert, enabled);
  useSocketEvent<[{ id: string }]>(
    "node:deleted",
    ({ id }) => store.remove(id),
    enabled,
  );
  useSocketEvent<[INodeLoadEvent]>("node:load", store.applyLoad, enabled);
};
