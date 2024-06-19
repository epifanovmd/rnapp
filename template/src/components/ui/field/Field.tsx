import { createSlot, useSlotProps } from "@force-dev/react";
import {
  Col,
  FlexProps,
  RenderConditional,
  Row,
} from "@force-dev/react-mobile";
import React, { FC, memo, PropsWithChildren } from "react";

import { Text, TextProps } from "../text";
import { Touchable, TouchableProps } from "../touchable";
import { FieldLabel } from "./FieldLabel";
import { FieldValue } from "./FieldValue";

export interface FieldProps extends TouchableProps {}

const Label = createSlot<TextProps>("Label");
const LeftIcon = createSlot("LeftIcon");
const RightIcon = createSlot("RightIcon");
const Content = createSlot<FlexProps>("Content");
const ContentValue = createSlot<FlexProps>("ContentValue");
const Description = createSlot<TextProps>("Description");
const Error = createSlot<TextProps>("Error");

export interface FieldSlots {
  Label: typeof Label;
  LeftIcon: typeof LeftIcon;
  RightIcon: typeof RightIcon;
  Content: typeof Content;
  ContentValue: typeof ContentValue;
  Description: typeof Description;
  Error: typeof Error;
}

const _Field: FC<PropsWithChildren<FieldProps>> = memo(
  ({ children, ...rest }) => {
    const {
      leftIcon,
      label,
      content,
      contentValue,
      rightIcon,
      description,
      error,
    } = useSlotProps(Field, children);

    const borderColor =
      (error?.text ? "red" : content?.borderColor) || "#5f5f5f40";

    return (
      <Touchable flexShrink={1} {...rest}>
        <Row
          alignItems={"center"}
          borderBottomWidth={1}
          minHeight={44}
          flexShrink={1}
          {...content}
          borderColor={borderColor}
        >
          {leftIcon?.children}

          <Col flexGrow={1} flexShrink={1}>
            <RenderConditional if={label?.text}>
              <FieldLabel {...label} />
            </RenderConditional>
            <FieldValue
              paddingTop={content?.children ? undefined : 0}
              {...contentValue}
            >
              {content?.children}
            </FieldValue>
          </Col>

          {rightIcon?.children}
        </Row>
        <RenderConditional
          if={error?.text?.trim() || description?.text?.trim()}
        >
          <Text {...(error?.text ? error : description)} />
        </RenderConditional>
      </Touchable>
    );
  },
);

export const Field = _Field as typeof _Field & FieldSlots;

Field.Label = Label;
Field.LeftIcon = LeftIcon;
Field.RightIcon = RightIcon;
Field.Content = Content;
Field.ContentValue = ContentValue;
Field.Description = Description;
Field.Error = Error;
