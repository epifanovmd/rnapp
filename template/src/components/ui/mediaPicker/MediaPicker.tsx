import React, {FC, memo, PropsWithChildren, useCallback} from 'react';
import {Col, FlexComponentProps} from '../flexView';
import {
  Asset,
  launchCamera,
  launchImageLibrary,
  MediaType,
  PhotoQuality,
} from 'react-native-image-picker';
import {Modal, useModal} from '../modal';
import {Touchable, TouchableProps} from '../touchable';
import {TextButton} from '../button';
import {Platform, StyleSheet} from 'react-native';
import {PERMISSIONS, request} from 'react-native-permissions';

const permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

export interface MediaPickerProps extends TouchableProps<any> {
  onChangeImage?: (images: Asset[]) => void;
  saveToPhotos?: boolean;
  quality?: PhotoQuality;
  mediaType?: MediaType;
}

export const MediaPicker: FC<
  PropsWithChildren<FlexComponentProps<MediaPickerProps>>
> = memo(
  ({onChangeImage, saveToPhotos = true, quality = 0.5, children, ...rest}) => {
    const {ref: modalRef} = useModal();

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

        <Modal ref={modalRef} modalStyle={s.modalStyle}>
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
  },
);

const s = StyleSheet.create({
  modalStyle: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
});
