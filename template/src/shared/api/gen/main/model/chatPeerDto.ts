import type { EChatMemberRole } from "./eChatMemberRole";
import type { PublicProfileDto } from "./publicProfileDto";

/**
 * Публичные данные собеседника в direct-чате (без приватных настроек членства).
 */
export interface ChatPeerDto {
  userId: string;
  role: EChatMemberRole;
  profile?: PublicProfileDto;
}
