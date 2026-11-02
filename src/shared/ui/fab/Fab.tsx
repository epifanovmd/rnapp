import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";

import { Icon, TIconName } from "../icon";
import { Touchable } from "../touchable";

/** Диаметр кнопки по умолчанию — как у круглых кнопок панели ввода. */
const FAB_SIZE = 40;

export interface IFabProps {
  icon: TIconName;
  onPress: () => void;
  /** Диаметр кнопки. */
  size?: number;
  /** `"surface"` — нейтральная, `"primary"` — основное действие экрана. По умолчанию `"surface"`. */
  variant?: "surface" | "primary";
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Круглая плавающая кнопка действия. */
export const Fab: FC<IFabProps> = memo(
  ({
    icon,
    onPress,
    size = FAB_SIZE,
    variant = "surface",
    disabled,
    accessibilityLabel,
  }) => {
    const { colors } = useTheme();
    const primary = variant === "primary";

    return (
      <Touchable
        circle={size}
        centerContent
        bg={primary ? "primary" : "surface"}
        borderColor={primary ? undefined : "border"}
        borderWidth={primary ? undefined : 1}
        elevation={4}
        disabled={disabled}
        onPress={onPress}
        accessibilityRole={"button"}
        accessibilityLabel={accessibilityLabel}
      >
        <Icon
          name={icon}
          size={Math.round(size / 2)}
          color={primary ? colors.white : undefined}
        />
      </Touchable>
    );
  },
);

Fab.displayName = "Fab";
