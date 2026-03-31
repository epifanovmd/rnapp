import { iocHook } from "@di";

import { IMessengerSocketService } from "./messengerSocket.types";

export const useMessengerSocket = iocHook(IMessengerSocketService);
