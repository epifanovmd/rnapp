import { isString } from "@force-dev/utils";
import React, { memo } from "react";
import { ActivityIndicator } from "react-native";

import { Icon } from "../icon";
import { Text } from "../text";
import { Touchable } from "../touchable";
import { useButtonStyles } from "./hooks";
import { IButtonProps } from "./types";

const _Button = <T extends any = unknown>({
  loading,
  title,
  style,
  indicatorProps,
  children,
  type = "primaryFilled",
  size,
  color: customColor,
  disabled,
  leftIcon,
  rightIcon,
  ...rest
}: IButtonProps<T>) => {
  const { styles, color } = useButtonStyles(type, size, disabled, customColor);

  return (
    <Touchable
      activeOpacity={0.7}
      delayPressIn={100}
      style={[styles, style]}
      {...rest}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} {...indicatorProps} />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} fill={color} />}
          {isString(title ?? children) ? (
            <Text lineBreakMode={"tail"} textStyle={"Body_S1"} color={color}>
              {title ?? children}
            </Text>
          ) : (
            title ?? children
          )}
          {rightIcon && <Icon name={rightIcon} fill={color} />}
        </>
      )}
    </Touchable>
  );
};

export const Button = memo(_Button) as typeof _Button;
