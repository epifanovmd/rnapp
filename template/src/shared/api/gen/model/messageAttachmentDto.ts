export interface MessageAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  /** @nullable */
  thumbnailUrl: string | null;
  /** @nullable */
  width: number | null;
  /** @nullable */
  height: number | null;
  /** @nullable */
  duration: number | null;
  /** @nullable */
  waveform: number[] | null;
}
