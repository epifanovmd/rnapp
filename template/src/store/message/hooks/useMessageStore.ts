import { iocHook } from "@di";

import { IMessageStore } from "../MessageStore.types";

export const useMessageStore = iocHook(IMessageStore);
