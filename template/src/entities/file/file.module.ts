import { ContainerModule } from "inversify";

import { FileRealtime } from "./model/realtime";
import { FileStore } from "./model/store";
import { IFileRealtime, IFileStore } from "./model/types";

export const fileModule = new ContainerModule(({ bind }) => {
  bind(IFileStore.Tid).to(FileStore).inSingletonScope();
  bind(IFileRealtime.Tid).to(FileRealtime).inSingletonScope();
});
