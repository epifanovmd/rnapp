import type { MessageDto } from "./messageDto";

export interface IMessageSearchDto {
  data: MessageDto[];
  totalCount: number;
}
