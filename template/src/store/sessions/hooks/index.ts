import { iocHook } from "@di";

import { ISessionStore } from "../SessionStore.types";

export const useSessionStore = iocHook(ISessionStore);
