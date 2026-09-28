/** Локальный файл, готовый к отправке в multipart-форме. */
export interface ILocalFile {
  /** `file://`-путь на устройстве. */
  uri: string;
  name: string;
  /** mime-тип; сервер сверяет его с расширением имени. */
  type: string;
  /** Размер в байтах, если источник его знает. */
  size?: number;
}
