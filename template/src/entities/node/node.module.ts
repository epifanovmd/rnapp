import { ContainerModule } from "inversify";

import { NodesStore } from "./model/store";
import { INodesStore } from "./model/types";

export const nodeModule = new ContainerModule(({ bind }) => {
  bind(INodesStore.Tid).to(NodesStore).inSingletonScope();
});
