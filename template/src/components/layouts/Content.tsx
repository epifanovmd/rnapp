import React, {FC, memo} from 'react';
import {Col, FlexComponentProps} from '../ui';

interface IProps extends FlexComponentProps {}

export const Content: FC<IProps> = memo(({children, ...rest}) => {
  return (
    <Col flex={1} ph={8} pb={8} {...rest}>
      {children}
    </Col>
  );
});
