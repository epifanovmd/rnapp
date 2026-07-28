import { ContainerModule } from "inversify";

import { AppDataStore } from "./app-data-store";
import { IAppDataStore } from "./app-data-types";

export const appDataModule = new ContainerModule(({ bind }) => {
  bind(IAppDataStore.Tid).to(AppDataStore).inSingletonScope();
});
