import { createSlot, useSlotProps } from "@force-dev/react";
import { Col, Row } from "@force-dev/react-mobile";
import { useTheme } from "@theme";
import React, { FC, memo, PropsWithChildren } from "react";

import { Text, TextProps } from "../text";
import { Touchable, TouchableProps } from "../touchable";

export interface FieldProps extends TouchableProps {
  label?: string;
  error?: string;
  description?: string;
}

const Label = createSlot<TextProps>("Label");
const Description = createSlot<TextProps>("Description");
const Error = createSlot<TextProps>("Error");

export interface FieldSlots {
  Label: typeof Label;
  Description: typeof Description;
  Error: typeof Error;
}

const _Field: FC<PropsWithChildren<FieldProps>> = memo(
  ({
    label: _label,
    error: _error,
    description: _description,
    children,
    ...rest
  }) => {
    const {
      theme: { color },
    } = useTheme();

    const { $children, label, description, error } = useSlotProps(
      Field,
      children,
    );

    const labelText = label?.text || _label;
    const errorText = (error?.text || _error || "").trim();
    const descriptionText = (description?.text || _description || "").trim();

    return (
      <Touchable flexShrink={1} {...rest}>
        <Col flexGrow={1} flexShrink={1}>
          {!!labelText && (
            <Text
              ml={8}
              mr={8}
              mb={4}
              fontSize={11}
              ellipsizeMode={"tail"}
              text={labelText}
              {...label}
            />
          )}
          <Row>{$children}</Row>
        </Col>
        {!!(errorText || descriptionText) && (
          <Text
            ml={8}
            mr={8}
            mt={2}
            color={errorText ? color.error.light : undefined}
            text={errorText || descriptionText}
            {...(errorText ? error : description)}
          />
        )}
      </Touchable>
    );
  },
);

export const Field = Object.assign(_Field, {
  Label,
  Description,
  Error,
});
