import { ContainerModule } from "inversify";

import { AppStateService } from "./app-state.service";
import { IAppStateService } from "./app-state.types";

export const appStateModule = new ContainerModule(({ bind }) => {
  bind(IAppStateService.Tid).to(AppStateService).inSingletonScope();
});
