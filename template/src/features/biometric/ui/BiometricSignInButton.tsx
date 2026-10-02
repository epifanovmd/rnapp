import { Button } from "@shared/ui";
import React, { FC } from "react";

import { useBiometric } from "../model/useBiometric";

/** Вход по биометрии; без подключённой на устройстве биометрии ничего не рендерит. */
export const BiometricSignInButton: FC = () => {
  const { available, authorization } = useBiometric();

  if (!available) return null;

  return (
    <Button
      appearance={"outline"}
      leftIcon={"scanFace"}
      title={"Войти по биометрии"}
      onPress={authorization}
    />
  );
};
