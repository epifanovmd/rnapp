import { ContainerModule } from "inversify";

import { AgentsStore } from "./model/store";
import { IAgentsStore } from "./model/types";

export const agentModule = new ContainerModule(({ bind }) => {
  bind(IAgentsStore.Tid).to(AgentsStore).inSingletonScope();
});
