import {
  IProfileUpdateRequestDto,
  KnownRole,
  PrivacySettingsDto,
  ProfileDto,
  UpdatePrivacySettingsBody,
  UserDto,
} from "@shared/api/gen/main/model";
import { createInjectDecorator, SupportInitialize } from "@shared/lib/di";
import { IEntityHolderResult, IHolderError } from "@shared/lib/holders";
import { ApiError, ApiResponse } from "@shared/lib/http";

import type { AccessScope, Permission } from "../lib/permissions";
import { ProfileModel } from "./profile-model";
import { UserModel } from "./user-model";

export const IUserStore = createInjectDecorator<IUserStore>("IUserStore");

/**
 * Доменный стор **текущего пользователя**: профиль, роли и эффективные
 * permissions. Отвечает только за данные авторизованного юзера — поток
 * аутентификации (вход/2FA/сессия) живёт в `IAuthStore`.
 */
export interface IUserStore {
  readonly user: UserDto | null;
  /** User-центричная view-модель (имя, инициалы, даты, permissions). */
  readonly model: UserModel | null;
  readonly profile: ProfileModel | null;
  readonly roles: KnownRole[];
  /** Объединение permissions из всех ролей и прямых permissions пользователя. */
  readonly permissions: Permission[];
  readonly directPermissions: Permission[];
  /** superadmin bypass (роль KnownRole.admin) */
  readonly isAdmin: boolean;
  readonly privacy: PrivacySettingsDto | null;
  readonly error: string | undefined;
  readonly isLoading: boolean;
  readonly isReady: boolean;

  /** Есть ли у пользователя указанный permission (через роль, напрямую, или wildcard-иерархия). */
  can(permission: Permission): boolean;
  /**
   * Область права на действие: `all` — над всеми сущностями, `own` — только
   * над своими (`<право>:own`), `null` — права нет.
   */
  scope(permission: Permission): AccessScope | null;
  /**
   * Можно ли действие над сущностью: право на все или право на свои, если
   * пользователь среди `owners` (владелец, создатель).
   */
  canOn(
    permission: Permission,
    owners: ReadonlyArray<string | null | undefined>,
  ): boolean;
  /** Есть ли у пользователя указанная роль. */
  hasRole(role: KnownRole): boolean;

  /** Мгновенно положить пользователя без запроса (например, из ответа login). */
  seed(user: UserDto): void;
  /** Точечно обновить поля текущего пользователя (например, из socket-события). */
  patchUser(patch: Partial<UserDto>): void;
  /** Точечно обновить профиль текущего пользователя. */
  patchProfile(patch: Partial<ProfileDto>): void;
  /** Точечно обновить privacy-настройки (например, из socket-события). */
  patchPrivacy(settings: PrivacySettingsDto): void;

  /**
   * Загрузить текущего пользователя с сервера. Если данные уже есть —
   * обновляет их «тихо» (не сбрасывая видимое состояние).
   */
  load(): Promise<IEntityHolderResult<UserDto, IHolderError>>;
  /** Принудительное фоновое обновление. */
  refresh(): Promise<IEntityHolderResult<UserDto, IHolderError>>;
  updateProfile(
    data: IProfileUpdateRequestDto,
  ): Promise<ApiResponse<ProfileDto, ApiError>>;

  loadPrivacy(): Promise<void>;
  updatePrivacy(
    data: UpdatePrivacySettingsBody,
  ): Promise<PrivacySettingsDto | undefined>;
  setUsername(username: string): Promise<ApiResponse<UserDto, ApiError>>;
  /** Смена пароля; остальные сессии сервер завершает. */
  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<void, ApiError>>;
  /** Запросить смену email: код уходит на новый адрес. */
  requestEmailChange(email: string): Promise<ApiResponse<UserDto, ApiError>>;
  /** Подтвердить смену email кодом из письма на новый адрес. */
  confirmEmailChange(code: string): Promise<ApiResponse<UserDto, ApiError>>;
  /** Код подтверждения текущего email уходит на этот email. */
  requestVerifyEmail(): Promise<ApiResponse<void, ApiError>>;
  verifyEmail(code: string): Promise<ApiResponse<void, ApiError>>;

  reset(): void;

  /** Удалить свой аккаунт; нужен текущий пароль. */
  deleteMyAccount(password: string): Promise<ApiResponse<void, ApiError>>;
}

export const IUserRealtime =
  createInjectDecorator<IUserRealtime>("IUserRealtime");

/**
 * Realtime-мост: подписывается на socket-события текущего пользователя и
 * синхронизирует `IUserStore`/`ISessionStore` без поллинга. Запускается на
 * время авторизованной сессии (см. `AppDataStore.initialize`), `initialize()`
 * возвращает отписку.
 */
export type IUserRealtime = SupportInitialize;
