import { iocHook } from "@di";

import { IChatListStore } from "../ChatListStore.types";

export const useChatListStore = iocHook(IChatListStore);
