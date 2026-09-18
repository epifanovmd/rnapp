import type { MediaItemDto } from "./mediaItemDto";

export interface IMediaGalleryDto {
  data: MediaItemDto[];
  totalCount: number;
}
