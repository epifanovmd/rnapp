import { ContainerModule } from "inversify";

import { AuditStore } from "./model/store";
import { IAuditStore } from "./model/types";

export const auditModule = new ContainerModule(({ bind }) => {
  bind(IAuditStore.Tid).to(AuditStore).inSingletonScope();
});
