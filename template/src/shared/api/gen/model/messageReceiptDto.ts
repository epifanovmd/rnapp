import type { EMessageStatus } from "./eMessageStatus";
import type { MessageReceiptDtoUser } from "./messageReceiptDtoUser";

export interface MessageReceiptDto {
  userId: string;
  status: EMessageStatus;
  updatedAt: string;
  user?: MessageReceiptDtoUser;
}
