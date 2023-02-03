import React, {FC, memo} from 'react';
import {useTheme} from '../../common';
import {Col, FlexComponentProps} from '../elements';
import {SafeArea} from '../ui';

interface IProps extends FlexComponentProps {}

export const ScreenContainer: FC<IProps> = memo(({children, ...rest}) => {
  const {theme} = useTheme();

  return (
    <SafeArea bg={theme.color.grey.grey200}>
      <Col height={'100%'} bg={theme.color.common.white} {...rest}>
        {children}
      </Col>
    </SafeArea>
  );
});
