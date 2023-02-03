import React, {FC, memo} from 'react';
import {ScreenContainer} from '../../layouts';
import {Button, Text} from '../../ui';
import {StackProps} from '../../../navigation';

export const OtherFirstScreen: FC<StackProps> = memo(({navigation, route}) => (
  <ScreenContainer>
    <Text>{route.name}</Text>
    <Button
      title={'OtherSecondScreen'}
      onPress={() => navigation.navigate('OtherSecondScreen')}
    />
  </ScreenContainer>
));
