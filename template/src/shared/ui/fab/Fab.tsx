import React, { FC, memo } from "react";

import { Icon, TIconName } from "../icon";
import { Touchable } from "../touchable";

/** Диаметр кнопки по умолчанию. */
const FAB_SIZE = 44;

export interface IFabProps {
  icon: TIconName;
  onPress: () => void;
  /** Диаметр кнопки. */
  size?: number;
  disabled?: boolean;
}

/** Круглая плавающая кнопка действия. */
export const Fab: FC<IFabProps> = memo(
  ({ icon, onPress, size = FAB_SIZE, disabled }) => (
    <Touchable
      circle={size}
      centerContent
      bg={"surface"}
      borderColor={"border"}
      borderWidth={1}
      elevation={4}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon name={icon} size={Math.round(size / 2)} />
    </Touchable>
  ),
);

Fab.displayName = "Fab";
