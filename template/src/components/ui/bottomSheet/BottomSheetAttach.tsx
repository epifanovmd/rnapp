import { useTheme } from "@core";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { pick } from "@react-native-documents/picker";
import { PredefinedFileTypes } from "@react-native-documents/picker/src/fileTypes";
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
import {
  launchCamera,
  launchImageLibrary,
  MediaType,
  PhotoQuality,
} from "react-native-image-picker";
import { PERMISSIONS, request } from "react-native-permissions";
import { SafeAreaView } from "react-native-safe-area-context";

import { Row } from "../../flexView";
import { BottomSheet, BottomSheetProps, Touchable } from "../../ui";
import { Icon } from "../icon";
import { useBottomSheetRef } from "./hooks";

const permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

export interface BottomSheetAttachProps {
  saveToPhotos?: boolean;
  quality?: PhotoQuality;
  mediaType?: MediaType;
  selectionLimit?: number;

  camera?: boolean;
  images?: boolean;
  files?: boolean;

  fileType?: PredefinedFileTypes;
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

export interface BottomSheetAttachOptions extends BottomSheetAttachProps {
  onChange: (value: AttachValue[]) => void;
}

export interface BottomSheetAttachContext {
  open: (options: BottomSheetAttachOptions) => void;
}

export const BottomSheetAttachContext = createContext<BottomSheetAttachContext>(
  undefined as unknown as BottomSheetAttachContext,
);

export const useBottomSheetAttach = () => {
  const attachModalContext = useContext(BottomSheetAttachContext);

  if (!attachModalContext) {
    throw new Error("AttachModalContext is not provided");
  }

  return attachModalContext;
};

export const BottomSheetAttachProvider: FC<
  PropsWithChildren<BottomSheetAttachProps & BottomSheetProps>
> = memo(
  ({
    saveToPhotos = true,
    quality = 0.5,
    children,
    selectionLimit = 1,
    camera = true,
    images = true,
    files = true,
    fileType = "*/*",
    ...rest
  }) => {
    const ref = useBottomSheetRef();
    const { colors } = useTheme();

    const _saveToPhotos = useRef<boolean>(saveToPhotos);
    const _quality = useRef<PhotoQuality>(quality);
    const _limit = useRef<number>(selectionLimit);

    const _fileType = useRef<PredefinedFileTypes>(fileType);

    const [_camera, setCamera] = useState<boolean>(camera);
    const [_images, setImages] = useState<boolean>(images);
    const [_files, setFiles] = useState<boolean>(files);

    const _onChange = useRef<BottomSheetAttachOptions["onChange"]>(null);

    const contextValue = useMemo<BottomSheetAttachContext>(
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
      pick({
        type: _fileType.current,
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
      <BottomSheetAttachContext.Provider value={contextValue}>
        {children}
        <BottomSheet ref={ref} {...rest}>
          <BottomSheetView style={{ flex: 1 }}>
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
                  <Icon name={"camera"} />
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
                  <Icon name={"image"} />
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
                  <Icon name={"document"} />
                </Touchable>
              )}
            </Row>
            <SafeAreaView edges={["bottom"]} />
          </BottomSheetView>
        </BottomSheet>
      </BottomSheetAttachContext.Provider>
    );
  },
);
