import React, {FC, memo} from 'react';
import {
  BorderButton,
  Button,
  Checkbox,
  Col,
  ScreenContainer,
  SwitchTheme,
  Text,
  TextButton,
  Modal,
  useModalRef,
} from '../../components';
import {AppScreenProps} from '../../navigation';
import {useNotification} from '../../notification';
import {SafeAreaView} from 'react-native';

interface IProps extends AppScreenProps {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let id: string;

export const Screen1: FC<IProps> = memo(({navigation, route}) => {
  const {showMessage, hideMessage} = useNotification();
  const modalRef = useModalRef();

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
      <Button mv={8} title={'hideMessage'} onPress={() => hideMessage()} />
      <Button
        mv={8}
        title={'show modal'}
        onPress={() => modalRef.current?.open()}
      />
      <Modal ref={modalRef} adjustToContentHeight={true}>
        <SafeAreaView>
          <Col pa={16}>
            <Text>Модальное окно</Text>
            <Button
              title={'hideModal'}
              onPress={() => modalRef.current?.close()}
            />
          </Col>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
});
