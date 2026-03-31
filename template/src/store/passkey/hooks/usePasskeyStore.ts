import { iocHook } from "@di";

import { IPasskeyStore } from "../PasskeyStore.types";

export const usePasskeyStore = iocHook(IPasskeyStore);
