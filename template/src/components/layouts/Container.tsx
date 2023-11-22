import React, {FC, memo} from 'react';
import {Col, FlexComponentProps} from '../elements';
import {SafeArea} from '../ui';

interface IProps extends FlexComponentProps {}

export const Container: FC<IProps> = memo(({children, ...rest}) => {
  return (
    <SafeArea>
      <Col flex={1} {...rest}>
        {children}
      </Col>
    </SafeArea>
  );
});
