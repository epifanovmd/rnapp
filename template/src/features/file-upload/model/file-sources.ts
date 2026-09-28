import type { ILocalFile } from "@shared/lib/files";
import { pickDocuments, pickPhotos, takePhoto } from "@shared/lib/media-picker";
import type { IActionSheetItem } from "@shared/ui";

export type TFileSourceKey = "gallery" | "camera" | "documents";

/** Источник файлов: пункт шторки и способ получить файлы. */
export interface IFileSource extends IActionSheetItem<TFileSourceKey> {
  pick: () => Promise<ILocalFile[]>;
}

/** Сколько фото можно выбрать за раз. */
const PHOTOS_LIMIT = 10;

/** Источники «Моих файлов»; новый источник — новая запись. */
export const FILE_SOURCES: readonly IFileSource[] = [
  {
    key: "gallery",
    title: "Фото из галереи",
    description: `До ${PHOTOS_LIMIT} снимков за раз`,
    icon: "image",
    pick: () => pickPhotos({ limit: PHOTOS_LIMIT }),
  },
  {
    key: "camera",
    title: "Сделать снимок",
    description: "Камера устройства",
    icon: "camera",
    pick: takePhoto,
  },
  {
    key: "documents",
    title: "Файл с устройства",
    description: "Документы, архивы, аудио и видео",
    icon: "document",
    pick: () => pickDocuments({ multiple: true }),
  },
];
