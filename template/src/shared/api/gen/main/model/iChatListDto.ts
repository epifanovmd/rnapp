import type { ChatDto } from "./chatDto";

export interface IChatListDto {
  count?: number;
  totalCount?: number;
  offset?: number;
  limit?: number;
  data: ChatDto[];
}
