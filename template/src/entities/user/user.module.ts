import { ContainerModule } from "inversify";

import { UserRealtime } from "./model/realtime";
import { SessionStore } from "./model/session-store";
import { ISessionStore } from "./model/session-types";
import { UserStore } from "./model/store";
import { IUserRealtime, IUserStore } from "./model/types";

export const userModule = new ContainerModule(({ bind }) => {
  bind(ISessionStore.Tid).to(SessionStore).inSingletonScope();
  bind(IUserStore.Tid).to(UserStore).inSingletonScope();
  bind(IUserRealtime.Tid).to(UserRealtime).inSingletonScope();
});
