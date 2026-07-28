import type {
  ISignInRequestDto,
  ITokensDto,
  TSignUpRequestDto,
} from "@shared/api/gen/model";
import { createInjectDecorator } from "@shared/lib/di";

export enum AuthStatus {
  Idle = "idle",
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export const IAuthStore = createInjectDecorator<IAuthStore>();

/**
 * Стор аутентификации и сессии. Доменные данные пользователя (профиль, роли,
 * permissions) живут в `IUserStore`.
 */
export interface IAuthStore {
  readonly status: AuthStatus;
  readonly error: string | undefined;
  readonly isIdle: boolean;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly twoFactorToken: string | null;
  readonly twoFactorHint?: string;
  readonly isTwoFactorRequired: boolean;

  signIn(params: ISignInRequestDto): Promise<void>;
  verify2FA(password: string): Promise<void>;
  signUp(params: TSignUpRequestDto): Promise<void>;
  restore(tokens?: ITokensDto): Promise<void>;
  signOut(): void;
}
