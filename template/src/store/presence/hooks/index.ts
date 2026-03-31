import { iocHook } from "@di";

import { IPresenceStore } from "../PresenceStore.types";

export const usePresenceStore = iocHook(IPresenceStore);
