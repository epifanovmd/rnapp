import type { EFileStatus } from "./eFileStatus";

export interface IFileDto {
  id: string;
  /** @nullable */
  ownerId: string | null;
  name: string;
  type: string;
  size: number;
  status: EFileStatus;
  /**
   * Подписанная ссылка для показа: оптимизированная версия, если готова,
   * иначе оригинал. `null` — прямая загрузка не завершена. Срок ограничен.
   * @nullable
   */
  url: string | null;
  /**
   * Подписанная ссылка на скачивание оригинала под исходным именем.
   * @nullable
   */
  downloadUrl: string | null;
  /** @nullable */
  thumbnailUrl: string | null;
  /** @nullable */
  mediumUrl: string | null;
  /** @nullable */
  blurhash: string | null;
  /** @nullable */
  width: number | null;
  /** @nullable */
  height: number | null;
  /** @nullable */
  duration: number | null;
  /** @nullable */
  waveform: number[] | null;
  createdAt: string;
  updatedAt: string;
}
