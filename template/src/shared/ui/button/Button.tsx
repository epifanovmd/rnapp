import { isString } from "@shared/lib/utils/type-guards";
import React, { memo } from "react";
import { ActivityIndicator } from "react-native";

import { Icon } from "../icon";
import { Text } from "../text";
import { Touchable } from "../touchable";
import { useButtonStyles } from "./hooks";
import { IButtonProps } from "./types";

/**
 * Кнопка: `variant` (смысловой цвет) × `appearance` (filled/outline/ghost)
 * ортогональны. Контент — title/children, иконки по краям, loading-спиннер
 * с сохранением цвета контента.
 */
const ButtonImpl = <T extends any = unknown>({
  loading,
  title,
  style,
  indicatorProps,
  children,
  variant = "primary",
  appearance = "filled",
  size,
  color: customColor,
  disabled,
  leftIcon,
  rightIcon,
  ...rest
}: IButtonProps<T>) => {
  const { styles, contentColorKey, contentColor, hitSlop } = useButtonStyles(
    variant,
    appearance,
    size,
    disabled,
    customColor,
  );

  return (
    <Touchable
      accessibilityRole={"button"}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      activeOpacity={0.7}
      delayPressIn={100}
      style={[styles, style]}
      hitSlop={hitSlop}
      {...rest}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size={"small"}
          color={contentColor}
          {...indicatorProps}
        />
      ) : (
        <>
          {leftIcon && (
            <Icon name={leftIcon} width={20} height={20} color={contentColor} />
          )}
          {isString(title ?? children) ? (
            <Text
              lineBreakMode={"tail"}
              textStyle={"Body_S1"}
              color={contentColorKey}
            >
              {title ?? children}
            </Text>
          ) : (
            (title ?? children)
          )}
          {rightIcon && (
            <Icon
              name={rightIcon}
              width={20}
              height={20}
              color={contentColor}
            />
          )}
        </>
      )}
    </Touchable>
  );
};

export const Button = memo(ButtonImpl) as typeof ButtonImpl;
