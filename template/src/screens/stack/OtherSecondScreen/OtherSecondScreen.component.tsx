import React, {FC, memo} from 'react';
import {StackProps} from '../../../navigation';
import {Button, ScreenContainer, Text} from '../../../components';

export const OtherSecondScreen: FC<StackProps> = memo(({navigation, route}) => (
  <ScreenContainer>
    <Text>{route.name}</Text>
    <Button
      title={'OtherFirstScreen'}
      onPress={() => navigation.navigate('OtherFirstScreen')}
    />
    <Button title={'MAIN'} onPress={() => navigation.navigate('MAIN')} />
  </ScreenContainer>
));
