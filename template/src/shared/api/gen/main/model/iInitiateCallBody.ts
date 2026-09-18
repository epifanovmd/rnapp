import type { ECallType } from "./eCallType";

export interface IInitiateCallBody {
  calleeId: string;
  chatId?: string;
  type?: ECallType;
}
