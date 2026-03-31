import { iocHook } from "@di";

import { ISyncStore } from "../SyncStore.types";

export const useSyncStore = iocHook(ISyncStore);
