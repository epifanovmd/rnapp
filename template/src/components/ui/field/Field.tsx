import { createSlot, useSlotProps } from "@force-dev/react";
import React, { FC, memo, PropsWithChildren } from "react";

import { Col, Row } from "../../flexView";
import { ITextProps, Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface FieldProps extends ITouchableProps {
  label?: string;
  error?: string;
  description?: string;
}

const Label = createSlot<ITextProps>("Label");
const Description = createSlot<ITextProps>("Description");
const Error = createSlot<ITextProps>("Error");

const _Field: FC<PropsWithChildren<FieldProps>> = memo(
  ({
    label: _label,
    error: _error,
    description: _description,
    children,
    ...rest
  }) => {
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
            mt={2}
            color={errorText ? "alertError" : undefined}
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
