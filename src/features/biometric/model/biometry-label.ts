import type { TIconName } from "@shared/ui";

/**
 * Название датчика для подписей «Вход по …»: Face ID, Touch ID, на Android —
 * «отпечатку» (модуль отдаёт общий тип `Biometrics`).
 */
export const getBiometryLabel = (biometryType?: string): string => {
  if (biometryType === "FaceID") return "Face ID";
  if (biometryType === "TouchID") return "Touch ID";

  return "отпечатку";
};

/** Иконка датчика: лицо для Face ID, отпечаток для остальных. */
export const getBiometryIcon = (biometryType?: string): TIconName =>
  biometryType === "FaceID" ? "scanFace" : "fingerprint";
