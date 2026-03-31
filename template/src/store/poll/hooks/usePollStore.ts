import { iocHook } from "@di";

import { IPollStore } from "../PollStore.types";

export const usePollStore = iocHook(IPollStore);
