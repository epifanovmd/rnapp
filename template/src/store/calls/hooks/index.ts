import { iocHook } from "@di";

import { ICallStore } from "../CallStore.types";

export const useCallStore = iocHook(ICallStore);
