import type { EPrivacyLevel } from "./ePrivacyLevel";

export type UpdatePrivacySettingsBody = {
  showAvatar?: EPrivacyLevel;
  showPhone?: EPrivacyLevel;
  showLastOnline?: EPrivacyLevel;
};
