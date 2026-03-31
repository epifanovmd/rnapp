import { iocHook } from "@di";

import { IChatFolderStore } from "../ChatFolderStore.types";

export const useChatFolderStore = iocHook(IChatFolderStore);
