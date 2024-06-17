import { ISocketService } from "../Socket.types";
import { IClientsSocketService } from "./ClientsSocket.types";

@IClientsSocketService()
export class ClientsSocketService implements IClientsSocketService {
  constructor(@ISocketService() private _socketService: ISocketService) {}
}
