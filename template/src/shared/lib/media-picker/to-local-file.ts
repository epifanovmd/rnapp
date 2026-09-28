import type { ILocalFile } from "../files";

/** Имя из последнего сегмента пути. */
const nameFromUri = (uri: string): string =>
  decodeURIComponent(uri.split("/").pop()?.split("?")[0] || "file");

/** Фото из галереи или камеры; без uri файл пропускается. */
export const assetToLocalFile = (asset: {
  uri?: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}): ILocalFile | null =>
  asset.uri
    ? {
        uri: asset.uri,
        name: asset.fileName || nameFromUri(asset.uri),
        type: asset.type || "image/jpeg",
        ...(asset.fileSize === undefined ? {} : { size: asset.fileSize }),
      }
    : null;

/** Документ по его локальной копии (`file://`), с именем и типом оригинала. */
export const documentToLocalFile = (
  document: { name: string | null; type: string | null; size: number | null },
  localUri: string,
): ILocalFile => ({
  uri: localUri,
  name: document.name || nameFromUri(localUri),
  type: document.type || "application/octet-stream",
  ...(document.size === null ? {} : { size: document.size }),
});
