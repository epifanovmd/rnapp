import { ContainerModule } from "inversify";

import { UserSocketService } from "./api/user-socket";
import { IUserSocketService } from "./api/user-socket.types";
import { UserRealtime } from "./model/realtime";
import { SessionStore } from "./model/session-store";
import { ISessionStore } from "./model/session-types";
import { UserStore } from "./model/store";
import { IUserRealtime, IUserStore } from "./model/types";

export const userModule = new ContainerModule(({ bind }) => {
  bind(IUserSocketService.Tid).to(UserSocketService).inSingletonScope();
  bind(ISessionStore.Tid).to(SessionStore).inSingletonScope();
  bind(IUserStore.Tid).to(UserStore).inSingletonScope();
  bind(IUserRealtime.Tid).to(UserRealtime).inSingletonScope();
});
