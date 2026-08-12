import { ContainerModule } from "inversify";

import { NavigationService } from "./navigation.service";
import { INavigationService } from "./navigation.types";

export const navigationModule = new ContainerModule(({ bind }) => {
  bind(INavigationService.Tid).to(NavigationService).inSingletonScope();
});
