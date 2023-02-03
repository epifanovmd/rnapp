import React, {FC, memo} from 'react';
import {
  BorderButton,
  Button,
  Checkbox,
  ScreenContainer,
  SwitchTheme,
  Text,
  TextButton,
} from '../../components';
import {AppScreenProps} from '../../navigation';
import {useNotification} from '../../notification';

interface IProps extends AppScreenProps {}

let id: string;

export const Screen1: FC<IProps> = memo(({navigation, route}) => {
  const {showMessage, hideMessage} = useNotification();

  return (
    <ScreenContainer pa={16}>
      <Text>{route.name}</Text>
      <SwitchTheme />
      <Checkbox label={'fdsfsd'} value={true} />
      <Button
        title={'OtherFirstScreen'}
        onPress={() => navigation.navigate('OtherFirstScreen')}
      />
      <BorderButton
        mv={8}
        title={'Show notify top'}
        onPress={() =>
          showMessage(
            {
              title: 'title',
              description: 'description',
            },
            {hideOnPress: true},
          )
        }
      />
      <Button
        mv={8}
        title={'Show notify center'}
        onPress={() =>
          showMessage('Simple message center', {
            position: 'center',
          })
        }
      />
      <TextButton
        mv={8}
        title={'Show notify bottom'}
        onPress={() => {
          id = showMessage('Simple message bottom', {
            position: 'bottom',
            floating: false,
          });
        }}
      />
      <Button title={'hideMessage'} onPress={() => hideMessage()} />
    </ScreenContainer>
  );
});
