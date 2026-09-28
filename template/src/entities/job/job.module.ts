import { ContainerModule } from "inversify";

import { JobRealtime } from "./model/realtime";
import { JobStore } from "./model/store";
import { IJobRealtime, IJobStore } from "./model/types";

export const jobModule = new ContainerModule(({ bind }) => {
  bind(IJobStore.Tid).to(JobStore).inSingletonScope();
  bind(IJobRealtime.Tid).to(JobRealtime).inSingletonScope();
});
