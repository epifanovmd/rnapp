import React from "react";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Col } from "../flex-view";
import { Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface FieldProps extends ITouchableProps {
  label?: string;
  error?: string;
  description?: string;
}

// Горизонтальный отступ 16 совпадает с внутренним паддингом контролов кита
// (TextField и т.п.) — подписи выровнены с их текстом.
const fieldSlots = {
  label: slot.of(Text, {
    always: true,
    defaultProps: { mb: 4, mh: 16, fontSize: 11, ellipsizeMode: "tail" },
  }),
  description: slot.of(Text, {
    always: true,
    defaultProps: { mt: 2, mh: 16, color: "textSecondary" },
  }),
  error: slot.of(Text, {
    always: true,
    defaultProps: { mt: 2, mh: 16, color: "danger" },
  }),
};

/**
 * Обёртка поля: label сверху, произвольный контент как есть, error/description
 * снизу. Горизонтальную раскладку контента Field не навязывает — Row при
 * необходимости собирает вызывающий (иначе растягивающиеся контролы вроде
 * TextField схлопывались внутри принудительного Row).
 */
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
        {content}
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
