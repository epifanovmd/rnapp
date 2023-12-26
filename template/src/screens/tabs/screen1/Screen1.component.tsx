import React, {FC, memo} from 'react';
import {
  BorderButton,
  Button,
  Container,
  SwitchTheme,
  Text,
  TextButton,
} from '../../../components';
import {AppScreenProps} from '../../../navigation';
import {
  Col,
  Modal,
  SafeArea,
  useModal,
  useNotification,
} from '@force-dev/react-mobile';

interface IProps extends AppScreenProps {}

let id: string;

export const Screen1: FC<IProps> = memo(({navigation, route}) => {
  const {show, hide} = useNotification();
  const {ref: modalRef} = useModal();

  return (
    <Container pa={16}>
      <Text>{route.name}</Text>
      <SwitchTheme />
      <Button
        title={'OtherFirstScreen'}
        onPress={() => navigation.navigate('OtherFirstScreen')}
      />
      <BorderButton mv={8} title={'Show notify top'} onPress={() => show('')} />
      <Button
        mv={8}
        title={'Show notify center'}
        onPress={() => show('Simple message center')}
      />
      <TextButton
        mv={8}
        title={'Show notify bottom'}
        onPress={() => {
          id = show('Simple message bottom');
        }}
      />
      <Button mv={8} title={'hideMessage'} onPress={() => hide(id)} />
      <Button
        mv={8}
        title={'show modal'}
        onPress={() => modalRef.current?.open()}
      />
      <Modal ref={modalRef} adjustToContentHeight={true}>
        <SafeArea>
          <Col pa={16}>
            <Text>Модальное окно</Text>
            <Button
              title={'hideModal'}
              onPress={() => modalRef.current?.close()}
            />
          </Col>
        </SafeArea>
      </Modal>
    </Container>
  );
});
