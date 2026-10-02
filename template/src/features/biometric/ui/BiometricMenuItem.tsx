import { ListItem, Switch } from "@shared/ui";
import React, { FC } from "react";

import { useBiometric } from "../model/useBiometric";

/** Строка меню «Вход по биометрии» с переключателем; без датчика на устройстве не рендерится. */
export const BiometricMenuItem: FC = () => {
  const { support, available, registration, onRemoveBiometric } =
    useBiometric();

  if (!support) return null;

  const toggle = () => (available ? onRemoveBiometric() : registration());

  return (
    <ListItem
      icon={"scanFace"}
      title={"Вход по биометрии"}
      subtitle={available ? "Подключён на этом устройстве" : "Выключен"}
      chevron={false}
      trailing={<Switch isActive={available} onChange={toggle} />}
      onPress={toggle}
    />
  );
};
