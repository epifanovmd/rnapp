import {
  BottomSheetView,
  Row,
  SafeArea,
  useModalRef,
} from "@force-dev/react-mobile";
import React, {
  createContext,
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Keyboard, Platform } from "react-native";
import { pick } from "react-native-document-picker";
import {
  perPlatformTypes,
  PlatformTypes,
} from "react-native-document-picker/src/fileTypes";
import {
  launchCamera,
  launchImageLibrary,
  MediaType,
  PhotoQuality,
} from "react-native-image-picker";
import { PERMISSIONS, request } from "react-native-permissions";

import { useTheme } from "~@theme";

import { CameraIcon, FileDocumentIcon, ImageIcon } from "../../icons";
import { Modal, ModalProps, Touchable } from "../../ui";

const permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

export interface AttachModalProps {
  saveToPhotos?: boolean;
  quality?: PhotoQuality;
  mediaType?: MediaType;
  selectionLimit?: number;

  camera?: boolean;
  images?: boolean;
  files?: boolean;

  fileType?: keyof PlatformTypes["ios"];
}

export interface AttachValue {
  id: number;
  uri: string;
  width?: number;
  height?: number;
  fileSize: number;
  type?: string;
  fileName?: string;
}

export interface AttachOptions extends AttachModalProps {
  onChange: (value: AttachValue[]) => void;
}

export interface AttachModalContext {
  open: (options: AttachOptions) => void;
}

export const AttachModalContext = createContext<AttachModalContext>({
  open: () => {
    throw new Error("Context not initialized");
  },
});

export const useAttachModal = () => useContext(AttachModalContext);

export const AttachModalProvider: FC<
  PropsWithChildren<AttachModalProps & ModalProps>
> = memo(
  ({
    saveToPhotos = true,
    quality = 0.5,
    children,
    selectionLimit = 1,
    camera = true,
    images = true,
    files = true,
    fileType = "allFiles",
    ...rest
  }) => {
    const ref = useModalRef();
    const { theme } = useTheme();

    const _saveToPhotos = useRef<boolean>(saveToPhotos);
    const _quality = useRef<PhotoQuality>(quality);
    const _limit = useRef<number>(selectionLimit);

    const _fileType = useRef<keyof PlatformTypes["ios"]>(fileType);

    const [_camera, setCamera] = useState<boolean>(camera);
    const [_images, setImages] = useState<boolean>(images);
    const [_files, setFiles] = useState<boolean>(files);

    const _onChange = useRef<AttachOptions["onChange"]>();

    const contextValue = useMemo<AttachModalContext>(
      () => ({
        open: value => {
          Keyboard.dismiss();

          _saveToPhotos.current = value?.saveToPhotos ?? saveToPhotos;
          _quality.current = value?.quality ?? quality;
          _limit.current = value?.selectionLimit ?? selectionLimit;
          _fileType.current = value?.fileType ?? fileType;

          setCamera(value?.camera ?? camera);
          setImages(value?.images ?? images);
          setFiles(value?.files ?? files);

          _onChange.current = value.onChange;
          ref.current?.present();
        },
      }),
      [
        camera,
        fileType,
        files,
        images,
        quality,
        ref,
        saveToPhotos,
        selectionLimit,
      ],
    );

    const _launchImageLibrary = useCallback(() => {
      ref.current?.close();
      launchImageLibrary({
        mediaType: "photo",
        selectionLimit: _limit.current,
        quality: _quality.current,
      }).then(res => {
        res.assets &&
          _onChange.current?.(
            res.assets
              .filter(item => !!item.uri)
              .map(item => ({
                id: Math.ceil(Math.random() * 1000000),
                fileName: item.fileName,
                width: item.width,
                height: item.height,
                uri: item.uri!,
                type: item.type,
                fileSize: item.fileSize ?? 0,
              })),
          );
      });
    }, [ref]);

    const _launchCamera = useCallback(() => {
      ref.current?.close();
      if (permission) {
        request(permission).then(result => {
          if (result === "granted") {
            launchCamera({
              mediaType: "photo",
              cameraType: "back",
              quality: _quality.current,
              saveToPhotos: _saveToPhotos.current,
            }).then(res => {
              res.assets &&
                _onChange.current?.(
                  res.assets
                    .filter(item => !!item.uri)
                    .map(item => ({
                      id: Math.ceil(Math.random() * 1000000),
                      fileName: item.fileName,
                      width: item.width,
                      height: item.height,
                      uri: item.uri!,
                      type: item.type,
                      fileSize: item.fileSize ?? 0,
                    })),
                );
            });
          }
        });
      }
    }, [ref]);

    const _launchDocument = useCallback(() => {
      ref.current?.close();
      pick<"ios">({
        type: perPlatformTypes[Platform.OS][_fileType.current],
      }).then(res => {
        res &&
          _onChange.current?.(
            res.map(item => ({
              id: Math.ceil(Math.random() * 1000000),
              fileName: item.name ?? undefined,
              uri: item.uri,
              type: item.type ?? undefined,
              fileSize: item.size ?? 0,
            })),
          );
      });
    }, [ref]);

    return (
      <AttachModalContext.Provider value={contextValue}>
        {children}
        <Modal ref={ref} {...rest}>
          <BottomSheetView>
            <Row pa={16}>
              {_camera && (
                <Touchable
                  onPress={_launchCamera}
                  bg={"#00000010"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  pa={16}
                  ma={8}
                  height={100}
                  width={100}
                  radius={8}
                >
                  <CameraIcon fill={theme.color.text} />
                </Touchable>
              )}

              {_images && (
                <Touchable
                  onPress={_launchImageLibrary}
                  bg={"#00000010"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  pa={16}
                  ma={8}
                  height={100}
                  width={100}
                  radius={8}
                >
                  <ImageIcon fill={theme.color.text} />
                </Touchable>
              )}

              {_files && (
                <Touchable
                  onPress={_launchDocument}
                  bg={"#00000010"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  pa={16}
                  ma={8}
                  height={100}
                  width={100}
                  radius={8}
                >
                  <FileDocumentIcon fill={"#000"} />
                </Touchable>
              )}
            </Row>
            <SafeArea bottom={true} />
          </BottomSheetView>
        </Modal>
      </AttachModalContext.Provider>
    );
  },
);
