import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from "@react-native-documents/picker";
import {
  type ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from "react-native-image-picker";

import type { ILocalFile } from "../files";
import {
  type IPickDocumentsOptions,
  type IPickPhotosOptions,
  MediaPickerError,
} from "./media-picker.types";
import { assetToLocalFile, documentToLocalFile } from "./to-local-file";

const PHOTO_QUALITY = 0.9;

const toFiles = (response: ImagePickerResponse): ILocalFile[] => {
  if (response.didCancel) return [];
  if (response.errorCode === "permission") {
    throw new MediaPickerError("permission", response.errorMessage);
  }
  if (response.errorCode === "camera_unavailable") {
    throw new MediaPickerError("unavailable", response.errorMessage);
  }
  if (response.errorCode) {
    throw new MediaPickerError("failed", response.errorMessage);
  }

  return (response.assets ?? [])
    .map(assetToLocalFile)
    .filter((file): file is ILocalFile => file !== null);
};

/** Фото из галереи (системный пикер); отмена — пустой список. */
export const pickPhotos = async ({
  limit = 0,
}: IPickPhotosOptions = {}): Promise<ILocalFile[]> =>
  toFiles(
    await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: limit,
      quality: PHOTO_QUALITY,
    }),
  );

/** Снимок камерой; отмена — пустой список. */
export const takePhoto = async (): Promise<ILocalFile[]> =>
  toFiles(
    await launchCamera({
      mediaType: "photo",
      quality: PHOTO_QUALITY,
      saveToPhotos: false,
    }),
  );

/**
 * Файлы из «Файлов»/хранилищ. Выбранный файл может быть `content://` или
 * защищённым — отправляется его локальная копия в кэше.
 */
export const pickDocuments = async ({
  multiple = true,
}: IPickDocumentsOptions = {}): Promise<ILocalFile[]> => {
  let picked;

  try {
    picked = await pick({
      type: [types.allFiles],
      allowMultiSelection: multiple,
    });
  } catch (e) {
    if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
      return [];
    }

    throw new MediaPickerError("failed", (e as Error)?.message);
  }

  const [first, ...rest] = picked.map(document => ({
    uri: document.uri,
    fileName: document.name ?? "file",
  }));

  if (!first) return [];

  const copies = await keepLocalCopy({
    files: [first, ...rest],
    destination: "cachesDirectory",
  });

  return copies.flatMap((copy, index) =>
    copy.status === "success"
      ? [documentToLocalFile(picked[index], copy.localUri)]
      : [],
  );
};
