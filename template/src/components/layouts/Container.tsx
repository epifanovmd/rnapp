import React, {FC, memo, PropsWithChildren} from 'react';
import {SafeArea, Col, FlexProps} from '@force-dev/react-mobile';

interface IProps extends FlexProps {}

export const Container: FC<PropsWithChildren<IProps>> = memo(
  ({children, ...rest}) => {
    return (
      <SafeArea>
        <Col flex={1} {...rest}>
          {children}
        </Col>
      </SafeArea>
    );
  },
);
