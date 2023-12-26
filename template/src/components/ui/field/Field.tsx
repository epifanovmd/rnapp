import React, {FC, memo, PropsWithChildren} from 'react';
import {
  Col,
  createSlot,
  FlexProps,
  RenderConditional,
  Row,
  Text,
  TextProps,
  Touchable,
  TouchableProps,
  useSlotProps,
} from '@force-dev/react-mobile';

export interface FieldProps extends TouchableProps {}

const Label = createSlot<TextProps>('Label');
const LeftIcon = createSlot('LeftIcon');
const RightIcon = createSlot('RightIcon');
const Content = createSlot<FlexProps>('Content');
const Description = createSlot<TextProps>('Description');
const Error = createSlot<TextProps>('Error');

export interface FieldSlots {
  Label: typeof Label;
  LeftIcon: typeof LeftIcon;
  RightIcon: typeof RightIcon;
  Content: typeof Content;
  Description: typeof Description;
  Error: typeof Error;
}

const _Field: FC<PropsWithChildren<FieldProps & TouchableProps>> = memo(
  ({children, ...rest}) => {
    const {leftIcon, label, content, rightIcon, description, error} =
      useSlotProps(Field, children);

    const borderColor =
      error?.text !== undefined ? 'red' : content?.borderColor;

    return (
      <Touchable {...rest}>
        <Row
          alignItems={'center'}
          borderBottomWidth={1}
          minHeight={55}
          {...content}
          borderColor={borderColor}>
          {leftIcon?.children}

          <Col flexGrow={1} flexShrink={1}>
            <RenderConditional if={label?.text}>
              <Text
                fontSize={14}
                zIndex={1}
                ellipsizeMode={'tail'}
                {...label}
              />
            </RenderConditional>
            {content?.children}
          </Col>

          {rightIcon?.children}
        </Row>

        <RenderConditional if={error?.text ?? description?.text}>
          <Text {...(error?.text !== undefined ? error : description)} />
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
Field.Description = Description;
Field.Error = Error;
