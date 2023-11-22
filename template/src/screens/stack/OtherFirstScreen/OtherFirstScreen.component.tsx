import React, {FC, memo} from 'react';
import {StackProps} from '../../../navigation';
import {Button, Container, Text} from '../../../components';

export const OtherFirstScreen: FC<StackProps> = memo(({navigation, route}) => (
  <Container>
    <Text>{route.name}</Text>
    <Button
      title={'OtherSecondScreen'}
      onPress={() => navigation.navigate('OtherSecondScreen')}
    />
    <Button title={'MAIN'} onPress={() => navigation.navigate('MAIN')} />
  </Container>
));
