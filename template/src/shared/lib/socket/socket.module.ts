import { ContainerModule } from "inversify";

import { SocketTransport } from "./transport/socket.transport";
import { ISocketTransport } from "./transport/socket.transport.types";

export const socketModule = new ContainerModule(({ bind }) => {
  bind(ISocketTransport.Tid).to(SocketTransport).inSingletonScope();
});
