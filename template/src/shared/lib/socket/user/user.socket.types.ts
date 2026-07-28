import {
  PrivacySettingsDto,
  PublicProfileDto,
  SessionDto,
} from "@shared/api/gen/model";
import { createInjectDecorator } from "@shared/lib/di";

import {
  ISocketSessionPayload,
  ISocketUserEmailVerifiedPayload,
  ISocketUserPasswordChangedPayload,
  ISocketUserPrivilegesChangedPayload,
  ISocketUserUsernameChangedPayload,
} from "../events";

export interface UserSocketHandlers {
  onProfileUpdated?: (data: PublicProfileDto) => void;
  onUsernameChanged?: (data: ISocketUserUsernameChangedPayload) => void;
  onEmailVerified?: (data: ISocketUserEmailVerifiedPayload) => void;
  onPrivilegesChanged?: (data: ISocketUserPrivilegesChangedPayload) => void;
  onPrivacyChanged?: (data: PrivacySettingsDto) => void;
  onNewSession?: (data: SessionDto) => void;
  onSessionTerminated?: (data: ISocketSessionPayload) => void;
  /** Уведомление о смене пароля — security-нотификация, не мутирует стор. */
  onPasswordChanged?: (data: ISocketUserPasswordChangedPayload) => void;
}

export const IUserSocketService = createInjectDecorator<IUserSocketService>();

export interface IUserSocketService {
  subscribe(handlers: UserSocketHandlers): () => void;
}
