import { iocHook } from "@di";

import { IRoleStore } from "../RoleStore.types";

export const useRoleStore = iocHook(IRoleStore);
