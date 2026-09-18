export interface IFileDto {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
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
