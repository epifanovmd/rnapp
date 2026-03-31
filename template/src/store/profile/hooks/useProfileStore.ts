import { iocHook } from "@di";

import { IProfileStore } from "../ProfileStore.types";

export const useProfileStore = iocHook(IProfileStore);
