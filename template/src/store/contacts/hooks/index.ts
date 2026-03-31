import { iocHook } from "@di";

import { IContactStore } from "../ContactStore.types";

export const useContactStore = iocHook(IContactStore);
