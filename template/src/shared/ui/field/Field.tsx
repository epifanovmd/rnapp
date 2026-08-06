import React, { memo } from "react";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Col, Row } from "../flex-view";
import { ITextProps, Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface FieldProps extends ITouchableProps {
  label?: string;
  error?: string;
  description?: string;
}

const fieldSlots = {
  label: slot<ITextProps>(),
  description: slot<ITextProps>(),
  error: slot<ITextProps>(),
};

const FieldRoot = memo(
  ({
    props,
    slots,
    content,
  }: CompoundRootProps<FieldProps, never, typeof fieldSlots>) => {
    const {
      label: _label,
      error: _error,
      description: _description,
      ...rest
    } = props;
    const { label, description, error } = slots;

    const labelText = label.props?.text || _label;
    const errorText = (error.props?.text || _error || "").trim();
    const descriptionText = (
      description.props?.text ||
      _description ||
      ""
    ).trim();

    return (
      <Touchable flexShrink={1} {...rest}>
        <Col flexGrow={1} flexShrink={1}>
          {!!labelText && (
            <Text
              mb={4}
              fontSize={11}
              ellipsizeMode={"tail"}
              text={labelText}
              {...label.props}
            />
          )}
          <Row>{content}</Row>
        </Col>
        {!!(errorText || descriptionText) && (
          <Text
            mt={2}
            color={errorText ? "red500" : undefined}
            text={errorText || descriptionText}
            {...(errorText ? error.props : description.props)}
          />
        )}
      </Touchable>
    );
  },
);

export const Field = createCompound<FieldProps, never>()({
  name: "Field",
  render: FieldRoot,
  slots: fieldSlots,
});
