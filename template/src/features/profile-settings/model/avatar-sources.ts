import type { ILocalFile } from "@shared/lib/files";
import { pickPhotos, takePhoto } from "@shared/lib/media-picker";
import type { IActionSheetItem } from "@shared/ui";

export type TAvatarSourceKey = "gallery" | "camera";

export interface IAvatarSource extends IActionSheetItem<TAvatarSourceKey> {
  pick: () => Promise<ILocalFile[]>;
}

/** Откуда взять новое фото аватара. */
export const AVATAR_SOURCES: readonly IAvatarSource[] = [
  {
    key: "gallery",
    title: "Выбрать из галереи",
    icon: "image",
    pick: () => pickPhotos({ limit: 1 }),
  },
  {
    key: "camera",
    title: "Сделать снимок",
    icon: "camera",
    pick: takePhoto,
  },
];
