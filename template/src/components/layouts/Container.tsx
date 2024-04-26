import {Col, FlexProps, SafeArea} from '@force-dev/react-mobile';
import React, {FC, memo, PropsWithChildren} from 'react';
import {ViewProps} from 'react-native';

interface IProps extends FlexProps, ViewProps {
  safeAreBottom?: boolean;
  safeAreLeft?: boolean;
  safeAreRight?: boolean;
  safeAreTop?: boolean;
}

export const Container: FC<PropsWithChildren<IProps>> = memo(
  ({
    safeAreBottom = true,
    safeAreLeft,
    safeAreRight,
    safeAreTop = true,
    children,
    ...rest
  }) => {
    return (
      <SafeArea
        bottom={safeAreBottom}
        left={safeAreLeft}
        right={safeAreRight}
        top={safeAreTop}>
        <Col flex={1} {...rest}>
          {children}
        </Col>
      </SafeArea>
    );
  },
);
