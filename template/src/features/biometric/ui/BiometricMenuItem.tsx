import { SwitchRow } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";

import { IBiometricStore } from "../model/types";

/**
 * Строка меню «Вход по Face ID / Touch ID / отпечатку» с тумблером. Без датчика
 * скрыта, но остаётся, если вход уже включён, — чтобы его можно было выключить.
 */
export const BiometricMenuItem: FC = observer(() => {
  const store = IBiometricStore.useInstance();
  const { isSupported, isEnabled, isBusy, label, icon, sync, enable, disable } =
    store;

  useEffect(() => {
    sync();
  }, [sync]);

  const handleChange = useCallback(
    (value: boolean) => (value ? enable() : disable()),
    [enable, disable],
  );

  if (!isSupported && !isEnabled) return null;

  return (
    <SwitchRow
      icon={icon}
      label={`Вход по ${label}`}
      description={isEnabled ? "Включён на этом устройстве" : "Выключен"}
      value={isEnabled}
      onValueChange={handleChange}
      switchProps={{ loading: isBusy }}
      pv={12}
      ph={14}
    />
  );
});
