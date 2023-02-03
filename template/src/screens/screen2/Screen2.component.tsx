import React, {FC} from 'react';
import {ScreenContainer, Text} from '../../components';
import {AppScreenProps} from '../../navigation';

interface IProps extends AppScreenProps {}

export const Screen2: FC<IProps> = () => {
  return (
    <ScreenContainer>
      <Text>{'Screen 2'}</Text>
    </ScreenContainer>
  );
};
