import React, {FC, memo, PropsWithChildren, useMemo} from 'react';
import {Text} from '../text';
import {Col, Row, useFlexProps} from '../flexView';
import {Touchable, TouchableProps} from '../touchable';

export interface FieldProps extends Omit<TouchableProps<any>, 'row'> {
  label?: string;
  leftIcon?: JSX.Element | null;
  rightIcon?: JSX.Element | null;
  error?: string | boolean;
  disabled?: boolean;
}

export const Field: FC<PropsWithChildren<FieldProps>> = memo(
  ({
    label,
    leftIcon,
    rightIcon,
    error,

    children,
    ...rest
  }) => {
    const {flexProps, ownProps} = useFlexProps(rest);

    const {} = ownProps;

    const labelStyle = useMemo(
      () => ({
        fontSize: 12,
      }),
      [],
    );

    return (
      <Col>
        <Touchable
          alignItems={'center'}
          borderBottomWidth={1}
          borderColor={error ? 'red' : undefined}
          opacity={1}
          {...flexProps}
          row={true}>
          {leftIcon && (
            <Col
              alignItems={'center'}
              justify-content={'center'}
              marginLeft={'auto'}
              ml={4}
              mr={4}>
              {leftIcon}
            </Col>
          )}

          <Col flexGrow={1} flexShrink={1}>
            {!!label && (
              <Col>
                <Text zIndex={1} ellipsizeMode={'tail'} style={labelStyle}>
                  {label}
                </Text>
              </Col>
            )}

            {children}
          </Col>

          {rightIcon && (
            <Col
              alignItems={'center'}
              justify-content={'center'}
              marginLeft={'auto'}
              ml={4}
              mr={4}>
              {rightIcon}
            </Col>
          )}
        </Touchable>
        {!!error && (
          <Row alignItems={'center'}>
            <Text color={'red'} fontSize={12}>
              {error}
            </Text>
          </Row>
        )}
      </Col>
    );
  },
);
