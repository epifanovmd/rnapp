import React, {FC, memo} from 'react';
import {ScreenContainer, Text} from '../../components';
import {AppScreenProps} from '../../navigation';

interface IProps extends AppScreenProps {}

export const Screen1: FC<IProps> = memo(() => {
  return (
    <ScreenContainer>
      <Text>{'Screen 1'}</Text>
    </ScreenContainer>
  );
});
