import React, {FC, memo} from 'react';
import {StackProps} from '../../../navigation';
import {Button, Container, Text} from '../../../components';

export const OtherSecondScreen: FC<StackProps> = memo(({navigation, route}) => (
  <Container>
    <Text>{route.name}</Text>
    <Button
      title={'OtherFirstScreen'}
      onPress={() => navigation.navigate('OtherFirstScreen')}
    />
    <Button title={'MAIN'} onPress={() => navigation.navigate('MAIN')} />
  </Container>
));
