import type {
  ApiResponseDto,
  IDisable2FARequestDto,
  IEnable2FARequestDto,
  ISignInRequestDto,
  ITokensDto,
  TSignUpRequestDto,
} from "@shared/api/gen/main/model";
import { createInjectDecorator } from "@shared/lib/di";
import type { ApiError, ApiResponse } from "@shared/lib/http";

export enum AuthStatus {
  Idle = "idle",
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export const IAuthStore = createInjectDecorator<IAuthStore>("IAuthStore");

/**
 * Стор аутентификации и сессии. Доменные данные пользователя (профиль, роли,
 * permissions) живут в `IUserStore`.
 */
export interface IAuthStore {
  readonly status: AuthStatus;
  readonly isIdle: boolean;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly twoFactorToken: string | null;
  readonly twoFactorHint?: string;
  readonly isTwoFactorRequired: boolean;

  /** Вход; ошибка сервера — для тоста, `null` — вошли или нужен второй пароль. */
  signIn(params: ISignInRequestDto): Promise<ApiError | null>;
  verify2FA(password: string): Promise<ApiError | null>;
  /** Регистрация; ошибка сервера — для показа на экране, `null` — успех. */
  signUp(params: TSignUpRequestDto): Promise<ApiError | null>;
  restore(tokens?: ITokensDto): Promise<void>;
  signOut(): void;
  /** Завершить все сессии на сервере, включая текущую, и выйти. */
  signOutAll(): Promise<ApiResponse<void, ApiError>>;
  /** Включить 2FA: второй пароль (и подсказка к нему) поверх текущего пароля. */
  enable2FA(
    data: IEnable2FARequestDto,
  ): Promise<ApiResponse<ApiResponseDto, ApiError>>;
  disable2FA(
    data: IDisable2FARequestDto,
  ): Promise<ApiResponse<ApiResponseDto, ApiError>>;
}
