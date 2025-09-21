import { isString } from "@force-dev/utils";
import React, { memo } from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { Row } from "../../flexView";
import { Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface IButtonProps<T = unknown> extends ITouchableProps<T> {
  loading?: boolean;
  title?: React.JSX.Element | string;
  color?: ColorValue;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  indicatorProps?: ActivityIndicatorProps;
}

const _Button = <T extends any = unknown>({
  loading,
  title,
  color = "#fff",
  contentStyle,
  textStyle,
  indicatorProps,
  children,
  ...rest
}: IButtonProps<T>) => {
  return (
    <Touchable
      activeOpacity={0.7}
      delayPressIn={100}
      radius={4}
      row={true}
      bg={"#20AB7D"}
      justifyContent={"center"}
      alignItems={"center"}
      overflow={"hidden"}
      pa={8}
      minHeight={44}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} {...indicatorProps} />
      ) : (
        <Row alignItems={"center"} style={contentStyle}>
          {isString(title ?? children) ? (
            <Text lineBreakMode={"tail"} color={color} style={textStyle}>
              {title ?? children}
            </Text>
          ) : (
            title ?? children
          )}
        </Row>
      )}
    </Touchable>
  );
};

export const Button = memo(_Button) as typeof _Button;
