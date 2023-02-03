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
    <Button title={'MAIN'} onPress={() => navigation.navigate('MAIN')} />
  </ScreenContainer>
));
