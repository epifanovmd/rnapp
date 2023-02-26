import React, {FC, memo, PropsWithChildren, useCallback} from 'react';
import {Col, FlexComponentProps} from '../../elements';
import {
  Asset,
  launchCamera,
  launchImageLibrary,
  MediaType,
  PhotoQuality,
} from 'react-native-image-picker';
import {Modal, useModalRef} from '../../modal';
import {Touchable} from '../touchable';
import {TextButton} from '../button';
import {useThemeAwareObject} from '../../../theme';
import {Platform, StyleSheet} from 'react-native';
import {PERMISSIONS, request} from 'react-native-permissions';

const permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

interface IProps {
  onChangeImage?: (images: Asset[]) => void;
  saveToPhotos?: boolean;
  quality?: PhotoQuality;
  mediaType?: MediaType;
}

export const MediaPicker: FC<PropsWithChildren<FlexComponentProps<IProps>>> =
  memo(({onChangeImage, saveToPhotos, quality = 0.5, children, ...rest}) => {
    const styles = useThemeAwareObject(createStyles);
    const modalRef = useModalRef();

    const onOpenModal = useCallback(() => {
      modalRef.current?.open();
    }, [modalRef]);

    const onCloseModal = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    const _launchImageLibrary = useCallback(() => {
      modalRef.current?.close();
      launchImageLibrary({
        mediaType: 'photo',
        quality,
      }).then(res => {
        res.assets && onChangeImage?.(res.assets);
      });
    }, [modalRef, onChangeImage, quality]);

    const _launchCamera = useCallback(() => {
      modalRef.current?.close();
      if (permission) {
        request(permission).then(result => {
          if (result === 'granted') {
            launchCamera({
              mediaType: 'photo',
              quality,
              cameraType: 'back',
              saveToPhotos,
            }).then(res => {
              res.assets && onChangeImage?.(res.assets);
            });
          }
        });
      }
    }, [modalRef, quality, saveToPhotos, onChangeImage]);

    return (
      <Touchable flex={1} {...rest} onPress={onOpenModal}>
        {children}

        <Modal ref={modalRef} modalStyle={styles.modalStyle}>
          <Col radius={16} bg={'#fff'} pa={16} alignItems={'center'}>
            <TextButton pv={8} title={'Камера'} onPress={_launchCamera} />
            <TextButton
              pv={8}
              title={'Все фотографии'}
              onPress={_launchImageLibrary}
            />
          </Col>
          <Col mt={8} radius={16} bg={'#fff'} pa={16} alignItems={'center'}>
            <TextButton
              color={'red'}
              pv={8}
              title={'Закрыть'}
              onPress={onCloseModal}
            />
          </Col>
        </Modal>
      </Touchable>
    );
  });

const createStyles = () =>
  StyleSheet.create({
    modalStyle: {
      backgroundColor: 'transparent',
      shadowColor: 'transparent',
      padding: 16,
      marginBottom: 16,
      borderRadius: 16,
    },
  });
