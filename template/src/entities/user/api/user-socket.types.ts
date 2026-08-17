import type {
  PrivacySettingsDto,
  PublicProfileDto,
  SessionDto,
} from "@shared/api/gen/model";
import { createInjectDecorator } from "@shared/lib/di";

export interface UserUsernameChangedPayload {
  userId: string;
  username: string | null;
}

export interface UserEmailVerifiedPayload {
  verified: boolean;
}

export interface UserPasswordChangedPayload {
  userId: string;
  method: "change" | "reset";
}

export interface UserPrivilegesChangedPayload {
  roles: string[];
  permissions: string[];
}

export interface SessionTerminatedPayload {
  sessionId: string;
}

export interface UserSocketHandlers {
  onProfileUpdated?: (data: PublicProfileDto) => void;
  onUsernameChanged?: (data: UserUsernameChangedPayload) => void;
  onEmailVerified?: (data: UserEmailVerifiedPayload) => void;
  onPrivilegesChanged?: (data: UserPrivilegesChangedPayload) => void;
  onPrivacyChanged?: (data: PrivacySettingsDto) => void;
  onNewSession?: (data: SessionDto) => void;
  onSessionTerminated?: (data: SessionTerminatedPayload) => void;
  onPasswordChanged?: (data: UserPasswordChangedPayload) => void;
}

export const IUserSocketService =
  createInjectDecorator<IUserSocketService>("IUserSocketService");

export interface IUserSocketService {
  subscribe(handlers: UserSocketHandlers): () => void;
}
