import { iocHook } from "@di";

import { IBiometricStore } from "../BiometricStore.types";

export const useBiometricStore = iocHook(IBiometricStore);
