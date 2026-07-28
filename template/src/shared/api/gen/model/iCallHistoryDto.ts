import type { CallDto } from "./callDto";

export interface ICallHistoryDto {
  data: CallDto[];
  totalCount: number;
}
