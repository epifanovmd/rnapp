import { iocHook } from "@di";

import { IBotStore } from "../BotStore.types";

export const useBotStore = iocHook(IBotStore);
