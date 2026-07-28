import type { EPrivacyLevel } from "./ePrivacyLevel";

export interface PrivacySettingsDto {
  showLastOnline: EPrivacyLevel;
  showPhone: EPrivacyLevel;
  showAvatar: EPrivacyLevel;
}
