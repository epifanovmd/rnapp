import { iocHook } from "@di";

import { IChatStore } from "../ChatStore.types";

export const useChatStore = iocHook(IChatStore);
