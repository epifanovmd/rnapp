import { ContainerModule } from "inversify";

import { NetworkStatusService } from "./network.service";
import { INetworkStatusService } from "./network.types";

export const networkModule = new ContainerModule(({ bind }) => {
  bind(INetworkStatusService.Tid).to(NetworkStatusService).inSingletonScope();
});
