import { iocHook } from "@di";

import { ISocketTransport } from "../socketTransport.types";

export const useSocketTransport = iocHook(ISocketTransport);
