import React from "react";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Col, FlexProps, Row } from "../flex-view";
import { Text } from "../text";
import { SectionAction } from "./SectionAction";

export interface ISectionProps extends FlexProps {
  title?: string;
  description?: string;
}

const sectionSlots = {
  action: slot.of(SectionAction),
};

const SectionRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<ISectionProps, typeof sectionSlots>) => {
  const { title, description, ...rest } = props;
  const { action } = slots;
  const hasHeaderRow = !!title || action.present;

  return (
    <Col bg={"surface"} radius={16} pa={16} gap={12} {...rest}>
      {!!(hasHeaderRow || description) && (
        <Col gap={4}>
          {hasHeaderRow && (
            <Row
              alignItems={"center"}
              justifyContent={title ? "space-between" : "flex-end"}
              gap={8}
            >
              {!!title && (
                <Text textStyle={"Title_S1"} flexShrink={1}>
                  {title}
                </Text>
              )}
              {action.render()}
            </Row>
          )}
          {!!description && (
            <Text textStyle={"Body_S2"} color={"textSecondary"}>
              {description}
            </Text>
          )}
        </Col>
      )}
      {content}
    </Col>
  );
};

/**
 * Карточка-секция экрана: заголовок с действием справа (`Section.Action`),
 * описание и контент.
 *
 * @example
 * <Section title={"Ноды"} description={"Онлайн и офлайн"}>
 *   <Section.Action title={"Все"} onPress={openNodes} />
 *   ...
 * </Section>
 */
export const Section = createCompound<ISectionProps>()({
  name: "Section",
  render: SectionRoot,
  slots: sectionSlots,
});
