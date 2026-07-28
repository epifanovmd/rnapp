import type { CallDtoCallee } from "./callDtoCallee";
import type { CallDtoCaller } from "./callDtoCaller";
import type { ECallStatus } from "./eCallStatus";
import type { ECallType } from "./eCallType";

export interface CallDto {
  id: string;
  callerId: string;
  calleeId: string;
  /** @nullable */
  chatId: string | null;
  type: ECallType;
  status: ECallStatus;
  /** @nullable */
  startedAt: string | null;
  /** @nullable */
  endedAt: string | null;
  /** @nullable */
  duration: number | null;
  createdAt: string;
  updatedAt: string;
  caller?: CallDtoCaller;
  callee?: CallDtoCallee;
}
