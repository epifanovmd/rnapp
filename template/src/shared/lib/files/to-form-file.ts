import type { ILocalFile } from "./files.types";

/**
 * Файл для `FormData.append` в React Native: сетевой слой RN читает файл по
 * `{ uri, name, type }`, а сгенерированный клиент типизирует поле как `Blob`.
 */
export const toFormFile = (file: ILocalFile): Blob =>
  ({ uri: file.uri, name: file.name, type: file.type }) as unknown as Blob;

/** `file://`-URI из пути файловой системы. */
export const toFileUri = (path: string): string =>
  path.startsWith("file://") ? path : `file://${path}`;
