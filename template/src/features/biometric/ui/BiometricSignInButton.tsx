import { Button } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";

import { IBiometricStore } from "../model/types";

/** Вход по Face ID / Touch ID / отпечатку; без включённой на устройстве биометрии — пусто. */
export const BiometricSignInButton: FC = observer(() => {
  const store = IBiometricStore.useInstance();
  const { canSignIn, isBusy, label, icon, load, signIn } = store;

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = useCallback(() => signIn(), [signIn]);

  if (!canSignIn) return null;

  return (
    <Button
      appearance={"outline"}
      leftIcon={icon}
      loading={isBusy}
      disabled={isBusy}
      title={`Войти по ${label}`}
      onPress={handlePress}
    />
  );
});
