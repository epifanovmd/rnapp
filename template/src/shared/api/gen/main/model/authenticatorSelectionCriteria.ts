import type { AuthenticatorAttachment } from "./authenticatorAttachment";
import type { ResidentKeyRequirement } from "./residentKeyRequirement";
import type { UserVerificationRequirement } from "./userVerificationRequirement";

export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment;
  requireResidentKey?: boolean;
  residentKey?: ResidentKeyRequirement;
  userVerification?: UserVerificationRequirement;
}
