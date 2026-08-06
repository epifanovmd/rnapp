import React from "react";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Col, Row } from "../flex-view";
import { Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface FieldProps extends ITouchableProps {
  label?: string;
  error?: string;
  description?: string;
}

const fieldSlots = {
  label: slot.of(Text, {
    always: true,
    defaultProps: { mb: 4, fontSize: 11, ellipsizeMode: "tail" },
  }),
  description: slot.of(Text, { always: true, defaultProps: { mt: 2 } }),
  error: slot.of(Text, {
    always: true,
    defaultProps: { mt: 2, color: "danger" },
  }),
};

const FieldRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<FieldProps, typeof fieldSlots>) => {
  const {
    label: labelProp,
    error: errorProp,
    description: descriptionProp,
    ...rest
  } = props;
  const { label, description, error } = slots;

  const labelText = label.props?.text || labelProp;
  const errorText = (error.props?.text || errorProp || "").trim();
  const descriptionText = (
    description.props?.text ||
    descriptionProp ||
    ""
  ).trim();

  return (
    <Touchable flexShrink={1} {...rest}>
      <Col flexGrow={1} flexShrink={1}>
        {!!labelText && label.render({ defaults: { text: labelText } })}
        <Row>{content}</Row>
      </Col>
      {errorText
        ? error.render({ defaults: { text: errorText } })
        : !!descriptionText &&
          description.render({ defaults: { text: descriptionText } })}
    </Touchable>
  );
};

export const Field = createCompound<FieldProps>()({
  name: "Field",
  render: FieldRoot,
  slots: fieldSlots,
});
