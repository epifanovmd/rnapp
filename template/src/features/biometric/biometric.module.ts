import { ContainerModule } from "inversify";

import { NativeBiometricDevice } from "./model/native-biometric-device";
import { BiometricStore } from "./model/store";
import { IBiometricDevice, IBiometricStore } from "./model/types";

/** Вход по биометрии: стор (общий для меню, входа и бутстрапа) и нативный адаптер. */
export const biometricModule = new ContainerModule(({ bind }) => {
  bind(IBiometricDevice.Tid).to(NativeBiometricDevice).inSingletonScope();
  bind(IBiometricStore.Tid).to(BiometricStore).inSingletonScope();
});
