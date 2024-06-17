import { RenderConditional, Row } from "@force-dev/react-mobile";
import { isString } from "@force-dev/utils";
import React, { FC, memo } from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { Text } from "../text";
import { Touchable, TouchableProps } from "../touchable";

export interface ButtonProps extends TouchableProps {
  loading?: boolean;
  leftSlot?: React.JSX.Element;
  title?: React.JSX.Element | string;
  rightSlot?: React.JSX.Element;
  color?: ColorValue;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  indicatorProps?: ActivityIndicatorProps;
}

export const Button: FC<ButtonProps> = memo(
  ({
    loading,
    leftSlot,
    title,
    rightSlot,
    color = "#fff",
    contentStyle,
    textStyle,
    indicatorProps,
    children,
    ...rest
  }) => {
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
        <RenderConditional if={!!loading}>
          <ActivityIndicator size="small" color={color} {...indicatorProps} />
        </RenderConditional>

        <RenderConditional if={!loading}>
          <Row alignItems={"center"} style={contentStyle}>
            {leftSlot}

            {isString(title ?? children) ? (
              <Text lineBreakMode={"tail"} color={color} style={textStyle}>
                {title ?? children}
              </Text>
            ) : (
              title ?? children
            )}

            {rightSlot}
          </Row>
        </RenderConditional>
      </Touchable>
    );
  },
);
