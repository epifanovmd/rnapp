import { ContainerModule } from "inversify";

import { SocketTransport } from "./transport/socket.transport";
import { ISocketTransport } from "./transport/socket.transport.types";
import { UserSocketService } from "./user/user.socket";
import { IUserSocketService } from "./user/user.socket.types";

export const socketModule = new ContainerModule(({ bind }) => {
  bind(ISocketTransport.Tid).to(SocketTransport).inSingletonScope();
  bind(IUserSocketService.Tid).to(UserSocketService).inSingletonScope();
});
