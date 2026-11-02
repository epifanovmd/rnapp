import { ContainerModule } from "inversify";

import { AuditRealtime } from "./model/realtime";
import { AuditStore } from "./model/store";
import { IAuditRealtime, IAuditStore } from "./model/types";

export const auditModule = new ContainerModule(({ bind }) => {
  bind(IAuditStore.Tid).to(AuditStore).inSingletonScope();
  bind(IAuditRealtime.Tid).to(AuditRealtime).inSingletonScope();
});
