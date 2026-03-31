/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  AcceptContactParams,
  AddMembersParams,
  AddReactionParams,
  AnswerCallParams,
  ApiResponseDto,
  BanMemberParams,
  Base64URLString,
  BlockContactParams,
  BotCommandDto,
  BotDeleteMessageParams,
  BotDetailDto,
  BotDto,
  BotEditMessageParams,
  CallDto,
  ChatDto,
  ChatFolderDto,
  ChatInviteDto,
  ChatMemberDto,
  ClosePollParams,
  ContactDto,
  CreateInviteLinkParams,
  CreatePollParams,
  DeclineCallParams,
  DeleteBotParams,
  DeleteDeviceParams,
  DeleteFileParams,
  DeleteFolderParams,
  DeleteMessageParams,
  DeleteProfileParams,
  DeleteRoleParams,
  DeleteUserParams,
  DeleteWebhookParams,
  DeviceTokenDto,
  EditMessageParams,
  EndCallParams,
  GetBannedMembersParams,
  GetBotByIdParams,
  GetCallHistoryParams,
  GetChangesParams,
  GetChatByIdParams,
  GetChatMediaParams,
  GetChatMediaStatsParams,
  GetCommandsParams,
  GetContactsParams,
  GetFileByIdParams,
  GetInvitesParams,
  GetMessagesParams,
  GetPinnedMessagesParams,
  GetPollParams,
  GetProfileByIdParams,
  GetProfilesParams,
  GetUserByIdParams,
  GetUserByUsernameParams,
  GetUserChatsParams,
  GetUserOptionsParams,
  GetUsersParams,
  GetWebhookLogsParams,
  IAddMembersBody,
  IAddReactionBody,
  IBanMemberBody,
  IBannedMemberDto,
  IBiometricDevicesResponseDto,
  IBotEditMessageBody,
  IBotSendMessageBody,
  ICallHistoryDto,
  IChatListDto,
  ICreateBotBody,
  ICreateChannelBody,
  ICreateContactBody,
  ICreateDirectChatBody,
  ICreateFolderBody,
  ICreateGroupChatBody,
  ICreateInviteBody,
  ICreatePollBody,
  ICreateRoleRequestDto,
  IDeleteBiometricResponseDto,
  IDisable2FARequestDto,
  IEditMessageBody,
  IEnable2FARequestDto,
  IFileDto,
  IGenerateAuthenticationOptionsRequestDto,
  IGenerateNonceRequestDto,
  IGenerateNonceResponseDto,
  IInitiateCallBody,
  IMarkReadBody,
  IMediaGalleryDto,
  IMediaStatsDto,
  IMessageListDto,
  IMessageSearchDto,
  IMoveChatToFolderBody,
  IMuteChatBody,
  IProfileListDto,
  IProfileUpdateRequestDto,
  IRegisterBiometricRequestDto,
  IRegisterBiometricResponseDto,
  IRegisterDeviceBody,
  IRoleDto,
  IRolePermissionsRequestDto,
  ISendMessageBody,
  ISetCommandsBody,
  ISetSlowModeBody,
  ISetWebhookBody,
  ISetWebhookEventsBody,
  ISignInRequestDto,
  ISignInResponseDto,
  ISyncResponseDto,
  ITokensDto,
  IUpdateBotBody,
  IUpdateChannelBody,
  IUpdateChatBody,
  IUpdateFolderBody,
  IUpdateMemberRoleBody,
  IUpdateNotificationSettingsBody,
  IUserChangePasswordDto,
  IUserListDto,
  IUserLoginRequestDto,
  IUserOptionsDto,
  IUserPrivilegesRequestDto,
  IUserResetPasswordRequestDto,
  IUserUpdateRequestDto,
  IUserWithTokensDto,
  IVerify2FARequestDto,
  IVerifyAuthenticationRequestDto,
  IVerifyAuthenticationResponseDto,
  IVerifyBiometricSignatureRequestDto,
  IVerifyBiometricSignatureResponseDto,
  IVerifyRegistrationRequestDto,
  IVerifyRegistrationResponseDto,
  IVotePollBody,
  IWebhookLogsResponse,
  IWebhookTestResponse,
  JoinByInviteParams,
  LeaveChatParams,
  MarkAsReadParams,
  MessageDto,
  MoveChatToFolderParams,
  MuteChatParams,
  NotificationSettingsDto,
  PinChatParams,
  PinMessageParams,
  PollDto,
  PrivacySettingsDto,
  ProfileDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicProfileDto,
  PublicUserDto,
  RefreshPayload,
  RegenerateTokenParams,
  RemoveContactParams,
  RemoveMemberParams,
  RemoveReactionParams,
  RetractVoteParams,
  RevokeInviteParams,
  SearchChannelsParams,
  SearchMessages2Params,
  SearchMessagesParams,
  SearchUsersParams,
  SendMessageParams,
  SessionDto,
  SetCommandsParams,
  SetPrivilegesParams,
  SetRolePermissionsParams,
  SetSlowModeParams,
  SetUsernamePayload,
  SetWebhookEventsParams,
  SetWebhookParams,
  SubscribeToChannelParams,
  TerminateSessionParams,
  TestWebhookParams,
  TSignUpRequestDto,
  UnbanMemberParams,
  UnpinChatParams,
  UnpinMessageParams,
  UnregisterDeviceParams,
  UnsubscribeFromChannelParams,
  UpdateBotParams,
  UpdateChannelParams,
  UpdateChatParams,
  UpdateFolderParams,
  UpdateMemberRoleParams,
  UpdatePrivacySettingsPayload,
  UpdateProfileParams,
  UpdateUserParams,
  UploadFilePayload,
  UserDto,
  VerifyEmailParams,
  VoteParams,
} from "./data-contracts";
import { EContentType, HttpClient, RequestParams } from "./http-client";

export class Api<E = unknown> extends HttpClient<E> {
  /**
   * @description Получить список активных сессий пользователя.
   *
   * @tags Session
   * @name GetSessions
   * @summary Список сессий
   * @request GET:/api/session
   * @secure
   */
  getSessions = (params: RequestParams = {}) =>
    this.request<SessionDto[]>({
      url: `/api/session`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Завершить конкретную сессию.
   *
   * @tags Session
   * @name TerminateSession
   * @summary Завершение сессии
   * @request DELETE:/api/session/{id}
   * @secure
   */
  terminateSession = (
    { id, ...query }: TerminateSessionParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/session/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Завершить все сессии, кроме текущей.
   *
   * @tags Session
   * @name TerminateOtherSessions
   * @summary Завершение остальных сессий
   * @request POST:/api/session/terminate-others
   * @secure
   */
  terminateOtherSessions = (params: RequestParams = {}) =>
    this.request<void>({
      url: `/api/session/terminate-others`,
      method: "POST",
      ...params,
    });
  /**
   * @description Получить профиль текущего пользователя. Этот эндпоинт позволяет получить данные профиля пользователя, который выполнил запрос. Используется для получения информации о текущем пользователе, например, его имени, email, и других данных.
   *
   * @tags Profile
   * @name GetMyProfile
   * @summary Получение профиля текущего пользователя
   * @request GET:/api/profile/my
   * @secure
   */
  getMyProfile = (params: RequestParams = {}) =>
    this.request<ProfileDto>({
      url: `/api/profile/my`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить профиль текущего пользователя. Этот эндпоинт позволяет пользователю обновить свои данные, такие как имя, email и другие параметры профиля.
   *
   * @tags Profile
   * @name UpdateMyProfile
   * @summary Обновление профиля текущего пользователя
   * @request PATCH:/api/profile/my/update
   * @secure
   */
  updateMyProfile = (
    data: IProfileUpdateRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<ProfileDto>({
      url: `/api/profile/my/update`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить настройки приватности.
   *
   * @tags Profile
   * @name GetPrivacySettings
   * @summary Настройки приватности
   * @request GET:/api/profile/my/privacy
   * @secure
   */
  getPrivacySettings = (params: RequestParams = {}) =>
    this.request<PrivacySettingsDto>({
      url: `/api/profile/my/privacy`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить настройки приватности.
   *
   * @tags Profile
   * @name UpdatePrivacySettings
   * @summary Обновление настроек приватности
   * @request PATCH:/api/profile/my/privacy
   * @secure
   */
  updatePrivacySettings = (
    data: UpdatePrivacySettingsPayload,
    params: RequestParams = {},
  ) =>
    this.request<PrivacySettingsDto>({
      url: `/api/profile/my/privacy`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить профиль текущего пользователя. Этот эндпоинт позволяет пользователю удалить свой профиль из системы.
   *
   * @tags Profile
   * @name DeleteMyProfile
   * @summary Удаление профиля текущего пользователя
   * @request DELETE:/api/profile/my/delete
   * @secure
   */
  deleteMyProfile = (params: RequestParams = {}) =>
    this.request<Base64URLString>({
      url: `/api/profile/my/delete`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить все профили. Этот эндпоинт позволяет администраторам получить список всех пользователей системы. Он поддерживает пагинацию через параметры `offset` и `limit`.
   *
   * @tags Profile
   * @name GetProfiles
   * @summary Получение всех профилей
   * @request GET:/api/profile/all
   * @secure
   */
  getProfiles = (query: GetProfilesParams, params: RequestParams = {}) =>
    this.request<IProfileListDto>({
      url: `/api/profile/all`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить профиль по ID. Этот эндпоинт позволяет получить профиль другого пользователя по его ID. Доступен только для администраторов.
   *
   * @tags Profile
   * @name GetProfileById
   * @summary Получение профиля по ID
   * @request GET:/api/profile/{userId}
   * @secure
   */
  getProfileById = (
    { userId, ...query }: GetProfileByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<PublicProfileDto>({
      url: `/api/profile/${userId}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить профиль другого пользователя. Этот эндпоинт позволяет администраторам обновлять профиль других пользователей.
   *
   * @tags Profile
   * @name UpdateProfile
   * @summary Обновление профиля другого пользователя
   * @request PATCH:/api/profile/update/{userId}
   * @secure
   */
  updateProfile = (
    { userId, ...query }: UpdateProfileParams,
    data: IProfileUpdateRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<ProfileDto>({
      url: `/api/profile/update/${userId}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить профиль другого пользователя. Этот эндпоинт позволяет администраторам удалить профиль другого пользователя из системы.
   *
   * @tags Profile
   * @name DeleteProfile
   * @summary Удаление профиля другого пользователя
   * @request DELETE:/api/profile/delete/{userId}
   * @secure
   */
  deleteProfile = (
    { userId, ...query }: DeleteProfileParams,
    params: RequestParams = {},
  ) =>
    this.request<Base64URLString>({
      url: `/api/profile/delete/${userId}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить все роли с их правами.
   *
   * @tags Role
   * @name GetRoles
   * @summary Список ролей
   * @request GET:/api/roles
   * @secure
   */
  getRoles = (params: RequestParams = {}) =>
    this.request<IRoleDto[]>({
      url: `/api/roles`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать новую роль.
   *
   * @tags Role
   * @name CreateRole
   * @summary Создание роли
   * @request POST:/api/roles
   * @secure
   */
  createRole = (data: ICreateRoleRequestDto, params: RequestParams = {}) =>
    this.request<IRoleDto>({
      url: `/api/roles`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить роль.
   *
   * @tags Role
   * @name DeleteRole
   * @summary Удаление роли
   * @request DELETE:/api/roles/{id}
   * @secure
   */
  deleteRole = (
    { id, ...query }: DeleteRoleParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/roles/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Установить права для роли. Заменяет текущий набор прав роли указанным.
   *
   * @tags Role
   * @name SetRolePermissions
   * @summary Установка прав роли
   * @request PATCH:/api/roles/{id}/permissions
   * @secure
   */
  setRolePermissions = (
    { id, ...query }: SetRolePermissionsParams,
    data: IRolePermissionsRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IRoleDto>({
      url: `/api/roles/${id}/permissions`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить пользователя. Этот эндпоинт позволяет получить данные пользователя, который выполнил запрос.
   *
   * @tags User
   * @name GetMyUser
   * @summary Получение данных текущего пользователя
   * @request GET:/api/user/my
   * @secure
   */
  getMyUser = (params: RequestParams = {}) =>
    this.request<UserDto>({
      url: `/api/user/my`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить пользователя. Этот эндпоинт позволяет пользователю обновить свои данные, такие как email, телефон и другие параметры пользователя.
   *
   * @tags User
   * @name UpdateMyUser
   * @summary Обновление данных текущего пользователя
   * @request PATCH:/api/user/my/update
   * @secure
   */
  updateMyUser = (data: IUserUpdateRequestDto, params: RequestParams = {}) =>
    this.request<UserDto>({
      url: `/api/user/my/update`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить текущего пользователя. Этот эндпоинт позволяет удалить пользователя из системы.
   *
   * @tags User
   * @name DeleteMyUser
   * @summary Удаление текущего пользователя
   * @request DELETE:/api/user/my/delete
   * @secure
   */
  deleteMyUser = (params: RequestParams = {}) =>
    this.request<boolean>({
      url: `/api/user/my/delete`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Установить username для текущего пользователя.
   *
   * @tags User
   * @name SetUsername
   * @summary Установка username
   * @request PATCH:/api/user/my/username
   * @secure
   */
  setUsername = (data: SetUsernamePayload, params: RequestParams = {}) =>
    this.request<UserDto>({
      url: `/api/user/my/username`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Поиск пользователей по запросу (username, email, имя, фамилия).
   *
   * @tags User
   * @name SearchUsers
   * @summary Поиск пользователей
   * @request GET:/api/user/search
   * @secure
   */
  searchUsers = (query: SearchUsersParams, params: RequestParams = {}) =>
    this.request<IUserListDto>({
      url: `/api/user/search`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить пользователя по username.
   *
   * @tags User
   * @name GetUserByUsername
   * @summary Получение по username
   * @request GET:/api/user/by-username/{username}
   * @secure
   */
  getUserByUsername = (
    { username, ...query }: GetUserByUsernameParams,
    params: RequestParams = {},
  ) =>
    this.request<PublicUserDto>({
      url: `/api/user/by-username/${username}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить всех пользователей. Поддерживает пагинацию и поиск по email.
   *
   * @tags User
   * @name GetUsers
   * @summary Получение всех пользователей
   * @request GET:/api/user/all
   * @secure
   */
  getUsers = (query: GetUsersParams, params: RequestParams = {}) =>
    this.request<IUserListDto>({
      url: `/api/user/all`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить опции пользователей для выпадающих списков (id + name). name — имя и фамилия или email если профиль не заполнен.
   *
   * @tags User
   * @name GetUserOptions
   * @summary Опции пользователей
   * @request GET:/api/user/options
   * @secure
   */
  getUserOptions = (query: GetUserOptionsParams, params: RequestParams = {}) =>
    this.request<IUserOptionsDto>({
      url: `/api/user/options`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить пользователя по ID. Этот эндпоинт позволяет получить пользователя по его ID. Доступен только для администраторов.
   *
   * @tags User
   * @name GetUserById
   * @summary Получение пользователя по ID
   * @request GET:/api/user/{id}
   * @secure
   */
  getUserById = (
    { id, ...query }: GetUserByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<UserDto>({
      url: `/api/user/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Установить привилегии для пользователя. Этот эндпоинт позволяет администраторам устанавливать роль и права пользователя.
   *
   * @tags User
   * @name SetPrivileges
   * @summary Установка привилегий для пользователя
   * @request PATCH:/api/user/setPrivileges/{id}
   * @secure
   */
  setPrivileges = (
    { id, ...query }: SetPrivilegesParams,
    data: IUserPrivilegesRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<UserDto>({
      url: `/api/user/setPrivileges/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Запросить подтверждение email-адреса для текущего пользователя. Этот эндпоинт позволяет отправить пользователю письмо для подтверждения его email-адреса.
   *
   * @tags User
   * @name RequestVerifyEmail
   * @summary Запрос подтверждения email
   * @request POST:/api/user/requestVerifyEmail
   * @secure
   */
  requestVerifyEmail = (params: RequestParams = {}) =>
    this.request<boolean>({
      url: `/api/user/requestVerifyEmail`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Подтвердить email-адрес текущего пользователя по коду. Этот эндпоинт позволяет пользователю подтвердить свой email, используя код, полученный в письме.
   *
   * @tags User
   * @name VerifyEmail
   * @summary Подтверждение email-адреса
   * @request GET:/api/user/verifyEmail/{code}
   * @secure
   */
  verifyEmail = (
    { code, ...query }: VerifyEmailParams,
    params: RequestParams = {},
  ) =>
    this.request<ApiResponseDto>({
      url: `/api/user/verifyEmail/${code}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить пользователя. Этот эндпоинт позволяет администраторам обновлять других пользователей.
   *
   * @tags User
   * @name UpdateUser
   * @summary Обновление другого пользователя
   * @request PATCH:/api/user/update/{id}
   * @secure
   */
  updateUser = (
    { id, ...query }: UpdateUserParams,
    data: IUserUpdateRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<UserDto>({
      url: `/api/user/update/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Изменить пароль текущего пользователя. Этот эндпоинт позволяет пользователю изменить свой пароль.
   *
   * @tags User
   * @name ChangePassword
   * @summary Изменение пароля
   * @request POST:/api/user/changePassword
   * @secure
   */
  changePassword = (data: IUserChangePasswordDto, params: RequestParams = {}) =>
    this.request<ApiResponseDto>({
      url: `/api/user/changePassword`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить другого пользователя. Этот эндпоинт позволяет администраторам удалить другого пользователя из системы.
   *
   * @tags User
   * @name DeleteUser
   * @summary Удаление другого пользователя
   * @request DELETE:/api/user/delete/{id}
   * @secure
   */
  deleteUser = (
    { id, ...query }: DeleteUserParams,
    params: RequestParams = {},
  ) =>
    this.request<boolean>({
      url: `/api/user/delete/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Регистрация нового пользователя
   *
   * @tags Authorization
   * @name SignUp
   * @summary Регистрация
   * @request POST:/api/auth/sign-up
   */
  signUp = (data: TSignUpRequestDto, params: RequestParams = {}) =>
    this.request<IUserWithTokensDto>({
      url: `/api/auth/sign-up`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Авторизация пользователя
   *
   * @tags Authorization
   * @name SignIn
   * @summary Вход в систему
   * @request POST:/api/auth/sign-in
   */
  signIn = (data: ISignInRequestDto, params: RequestParams = {}) =>
    this.request<ISignInResponseDto>({
      url: `/api/auth/sign-in`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Запрос на сброс пароля
   *
   * @tags Authorization
   * @name RequestResetPassword
   * @summary Запрос сброса пароля
   * @request POST:/api/auth/request-reset-password
   */
  requestResetPassword = (
    data: IUserLoginRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<ApiResponseDto>({
      url: `/api/auth/request-reset-password`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Сброс пароля
   *
   * @tags Authorization
   * @name ResetPassword
   * @summary Смена пароля
   * @request POST:/api/auth/reset-password
   */
  resetPassword = (
    data: IUserResetPasswordRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<ApiResponseDto>({
      url: `/api/auth/reset-password`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновление токенов доступа
   *
   * @tags Authorization
   * @name Refresh
   * @summary Обновление токенов
   * @request POST:/api/auth/refresh
   */
  refresh = (data: RefreshPayload, params: RequestParams = {}) =>
    this.request<ITokensDto>({
      url: `/api/auth/refresh`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Включить двухфакторную аутентификацию.
   *
   * @tags Authorization
   * @name Enable2Fa
   * @summary Включение 2FA
   * @request POST:/api/auth/enable-2fa
   * @secure
   */
  enable2Fa = (data: IEnable2FARequestDto, params: RequestParams = {}) =>
    this.request<ApiResponseDto>({
      url: `/api/auth/enable-2fa`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Отключить двухфакторную аутентификацию.
   *
   * @tags Authorization
   * @name Disable2Fa
   * @summary Отключение 2FA
   * @request POST:/api/auth/disable-2fa
   * @secure
   */
  disable2Fa = (data: IDisable2FARequestDto, params: RequestParams = {}) =>
    this.request<ApiResponseDto>({
      url: `/api/auth/disable-2fa`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Верифицировать 2FA и получить токены.
   *
   * @tags Authorization
   * @name Verify2Fa
   * @summary Верификация 2FA
   * @request POST:/api/auth/verify-2fa
   */
  verify2Fa = (data: IVerify2FARequestDto, params: RequestParams = {}) =>
    this.request<IUserWithTokensDto>({
      url: `/api/auth/verify-2fa`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Регистрирует биометрические ключи с устройства
   *
   * @tags Biometric
   * @name RegisterBiometric
   * @request POST:/api/biometric/register
   * @secure
   */
  registerBiometric = (
    data: IRegisterBiometricRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IRegisterBiometricResponseDto>({
      url: `/api/biometric/register`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Генерирует nonce, который необходимо подписать на устройстве
   *
   * @tags Biometric
   * @name GenerateNonce
   * @request POST:/api/biometric/generate-nonce
   * @secure
   */
  generateNonce = (
    data: IGenerateNonceRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IGenerateNonceResponseDto>({
      url: `/api/biometric/generate-nonce`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Проверяет подпись и авторизует пользователя
   *
   * @tags Biometric
   * @name VerifySignature
   * @request POST:/api/biometric/verify-signature
   * @secure
   */
  verifySignature = (
    data: IVerifyBiometricSignatureRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IVerifyBiometricSignatureResponseDto>({
      url: `/api/biometric/verify-signature`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Список зарегистрированных устройств пользователя
   *
   * @tags Biometric
   * @name GetDevices
   * @request GET:/api/biometric/devices
   * @secure
   */
  getDevices = (params: RequestParams = {}) =>
    this.request<IBiometricDevicesResponseDto>({
      url: `/api/biometric/devices`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить зарегистрированное устройство
   *
   * @tags Biometric
   * @name DeleteDevice
   * @request DELETE:/api/biometric/{deviceId}
   * @secure
   */
  deleteDevice = (
    { deviceId, ...query }: DeleteDeviceParams,
    params: RequestParams = {},
  ) =>
    this.request<IDeleteBiometricResponseDto>({
      url: `/api/biometric/${deviceId}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отправить сообщение от имени бота.
   *
   * @tags Bot API
   * @name BotSendMessage
   * @summary Bot: отправка сообщения
   * @request POST:/api/bot-api/message/send
   * @secure
   */
  botSendMessage = (data: IBotSendMessageBody, params: RequestParams = {}) =>
    this.request<MessageDto>({
      url: `/api/bot-api/message/send`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Редактировать сообщение бота.
   *
   * @tags Bot API
   * @name BotEditMessage
   * @summary Bot: редактирование сообщения
   * @request POST:/api/bot-api/message/{id}/edit
   * @secure
   */
  botEditMessage = (
    { id, ...query }: BotEditMessageParams,
    data: IBotEditMessageBody,
    params: RequestParams = {},
  ) =>
    this.request<MessageDto>({
      url: `/api/bot-api/message/${id}/edit`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить сообщение бота.
   *
   * @tags Bot API
   * @name BotDeleteMessage
   * @summary Bot: удаление сообщения
   * @request DELETE:/api/bot-api/message/{id}
   * @secure
   */
  botDeleteMessage = (
    { id, ...query }: BotDeleteMessageParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/bot-api/message/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name CreateBot
   * @summary Создать бота
   * @request POST:/api/bot
   * @secure
   */
  createBot = (data: ICreateBotBody, params: RequestParams = {}) =>
    this.request<BotDetailDto>({
      url: `/api/bot`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name GetMyBots
   * @summary Мои боты
   * @request GET:/api/bot
   * @secure
   */
  getMyBots = (params: RequestParams = {}) =>
    this.request<BotDto[]>({
      url: `/api/bot`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name GetBotById
   * @summary Детали бота
   * @request GET:/api/bot/{id}
   * @secure
   */
  getBotById = (
    { id, ...query }: GetBotByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<BotDetailDto>({
      url: `/api/bot/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name UpdateBot
   * @summary Обновить бота
   * @request PATCH:/api/bot/{id}
   * @secure
   */
  updateBot = (
    { id, ...query }: UpdateBotParams,
    data: IUpdateBotBody,
    params: RequestParams = {},
  ) =>
    this.request<BotDetailDto>({
      url: `/api/bot/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name DeleteBot
   * @summary Удалить бота
   * @request DELETE:/api/bot/{id}
   * @secure
   */
  deleteBot = ({ id, ...query }: DeleteBotParams, params: RequestParams = {}) =>
    this.request<void>({
      url: `/api/bot/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name RegenerateToken
   * @summary Перегенерировать токен
   * @request POST:/api/bot/{id}/token
   * @secure
   */
  regenerateToken = (
    { id, ...query }: RegenerateTokenParams,
    params: RequestParams = {},
  ) =>
    this.request<BotDetailDto>({
      url: `/api/bot/${id}/token`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name SetWebhook
   * @summary Установить webhook
   * @request POST:/api/bot/{id}/webhook
   * @secure
   */
  setWebhook = (
    { id, ...query }: SetWebhookParams,
    data: ISetWebhookBody,
    params: RequestParams = {},
  ) =>
    this.request<BotDetailDto>({
      url: `/api/bot/${id}/webhook`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name DeleteWebhook
   * @summary Удалить webhook
   * @request DELETE:/api/bot/{id}/webhook
   * @secure
   */
  deleteWebhook = (
    { id, ...query }: DeleteWebhookParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/bot/${id}/webhook`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name SetCommands
   * @summary Установить команды бота
   * @request POST:/api/bot/{id}/commands
   * @secure
   */
  setCommands = (
    { id, ...query }: SetCommandsParams,
    data: ISetCommandsBody,
    params: RequestParams = {},
  ) =>
    this.request<BotCommandDto[]>({
      url: `/api/bot/${id}/commands`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name GetCommands
   * @summary Получить команды бота
   * @request GET:/api/bot/{id}/commands
   * @secure
   */
  getCommands = (
    { id, ...query }: GetCommandsParams,
    params: RequestParams = {},
  ) =>
    this.request<BotCommandDto[]>({
      url: `/api/bot/${id}/commands`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name TestWebhook
   * @summary Тестировать webhook (отправляет ping)
   * @request POST:/api/bot/{id}/webhook/test
   * @secure
   */
  testWebhook = (
    { id, ...query }: TestWebhookParams,
    params: RequestParams = {},
  ) =>
    this.request<IWebhookTestResponse>({
      url: `/api/bot/${id}/webhook/test`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name GetWebhookLogs
   * @summary Получить логи доставки webhook
   * @request GET:/api/bot/{id}/webhook/logs
   * @secure
   */
  getWebhookLogs = (
    { id, ...query }: GetWebhookLogsParams,
    params: RequestParams = {},
  ) =>
    this.request<IWebhookLogsResponse>({
      url: `/api/bot/${id}/webhook/logs`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Bot
   * @name SetWebhookEvents
   * @summary Обновить фильтр событий webhook
   * @request POST:/api/bot/{id}/webhook/events
   * @secure
   */
  setWebhookEvents = (
    { id, ...query }: SetWebhookEventsParams,
    data: ISetWebhookEventsBody,
    params: RequestParams = {},
  ) =>
    this.request<BotDetailDto>({
      url: `/api/bot/${id}/webhook/events`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Инициировать звонок.
   *
   * @tags Call
   * @name InitiateCall
   * @summary Начать звонок
   * @request POST:/api/call
   * @secure
   */
  initiateCall = (data: IInitiateCallBody, params: RequestParams = {}) =>
    this.request<CallDto>({
      url: `/api/call`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Ответить на звонок.
   *
   * @tags Call
   * @name AnswerCall
   * @summary Ответить
   * @request POST:/api/call/{id}/answer
   * @secure
   */
  answerCall = (
    { id, ...query }: AnswerCallParams,
    params: RequestParams = {},
  ) =>
    this.request<CallDto>({
      url: `/api/call/${id}/answer`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отклонить звонок.
   *
   * @tags Call
   * @name DeclineCall
   * @summary Отклонить
   * @request POST:/api/call/{id}/decline
   * @secure
   */
  declineCall = (
    { id, ...query }: DeclineCallParams,
    params: RequestParams = {},
  ) =>
    this.request<CallDto>({
      url: `/api/call/${id}/decline`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Завершить звонок.
   *
   * @tags Call
   * @name EndCall
   * @summary Завершить
   * @request POST:/api/call/{id}/end
   * @secure
   */
  endCall = ({ id, ...query }: EndCallParams, params: RequestParams = {}) =>
    this.request<CallDto>({
      url: `/api/call/${id}/end`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить историю звонков.
   *
   * @tags Call
   * @name GetCallHistory
   * @summary История звонков
   * @request GET:/api/call/history
   * @secure
   */
  getCallHistory = (query: GetCallHistoryParams, params: RequestParams = {}) =>
    this.request<ICallHistoryDto>({
      url: `/api/call/history`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить активный звонок.
   *
   * @tags Call
   * @name GetActiveCall
   * @summary Активный звонок
   * @request GET:/api/call/active
   * @secure
   */
  getActiveCall = (params: RequestParams = {}) =>
    this.request<CallDto | null>({
      url: `/api/call/active`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Установить режим медленной отправки.
   *
   * @tags Chat Moderation
   * @name SetSlowMode
   * @summary Медленный режим
   * @request PATCH:/api/chat/{id}/slow-mode
   * @secure
   */
  setSlowMode = (
    { id, ...query }: SetSlowModeParams,
    data: ISetSlowModeBody,
    params: RequestParams = {},
  ) =>
    this.request<{
      /** @format double */
      slowModeSeconds: number;
      chatId: string;
    }>({
      url: `/api/chat/${id}/slow-mode`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Заблокировать участника чата.
   *
   * @tags Chat Moderation
   * @name BanMember
   * @summary Блокировка участника
   * @request POST:/api/chat/{id}/members/{userId}/ban
   * @secure
   */
  banMember = (
    { id, userId, ...query }: BanMemberParams,
    data: IBanMemberBody,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/chat/${id}/members/${userId}/ban`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      ...params,
    });
  /**
   * @description Разблокировать участника чата.
   *
   * @tags Chat Moderation
   * @name UnbanMember
   * @summary Разблокировка участника
   * @request DELETE:/api/chat/{id}/members/{userId}/ban
   * @secure
   */
  unbanMember = (
    { id, userId, ...query }: UnbanMemberParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/chat/${id}/members/${userId}/ban`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Получить заблокированных участников.
   *
   * @tags Chat Moderation
   * @name GetBannedMembers
   * @summary Заблокированные участники
   * @request GET:/api/chat/{id}/members/banned
   * @secure
   */
  getBannedMembers = (
    { id, ...query }: GetBannedMembersParams,
    params: RequestParams = {},
  ) =>
    this.request<IBannedMemberDto[]>({
      url: `/api/chat/${id}/members/banned`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать или получить существующий личный чат.
   *
   * @tags Chat
   * @name CreateDirectChat
   * @summary Создание личного чата
   * @request POST:/api/chat/direct
   * @secure
   */
  createDirectChat = (
    data: ICreateDirectChatBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatDto>({
      url: `/api/chat/direct`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать групповой чат.
   *
   * @tags Chat
   * @name CreateGroupChat
   * @summary Создание группового чата
   * @request POST:/api/chat/group
   * @secure
   */
  createGroupChat = (data: ICreateGroupChatBody, params: RequestParams = {}) =>
    this.request<ChatDto>({
      url: `/api/chat/group`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать канал.
   *
   * @tags Chat
   * @name CreateChannel
   * @summary Создание канала
   * @request POST:/api/chat/channel
   * @secure
   */
  createChannel = (data: ICreateChannelBody, params: RequestParams = {}) =>
    this.request<ChatDto>({
      url: `/api/chat/channel`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить канал.
   *
   * @tags Chat
   * @name UpdateChannel
   * @summary Обновление канала
   * @request PATCH:/api/chat/channel/{id}
   * @secure
   */
  updateChannel = (
    { id, ...query }: UpdateChannelParams,
    data: IUpdateChannelBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatDto>({
      url: `/api/chat/channel/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Подписаться на публичный канал.
   *
   * @tags Chat
   * @name SubscribeToChannel
   * @summary Подписка на канал
   * @request POST:/api/chat/channel/{id}/subscribe
   * @secure
   */
  subscribeToChannel = (
    { id, ...query }: SubscribeToChannelParams,
    params: RequestParams = {},
  ) =>
    this.request<ChatDto>({
      url: `/api/chat/channel/${id}/subscribe`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отписаться от канала.
   *
   * @tags Chat
   * @name UnsubscribeFromChannel
   * @summary Отписка от канала
   * @request DELETE:/api/chat/channel/{id}/subscribe
   * @secure
   */
  unsubscribeFromChannel = (
    { id, ...query }: UnsubscribeFromChannelParams,
    params: RequestParams = {},
  ) =>
    this.request<Base64URLString>({
      url: `/api/chat/channel/${id}/subscribe`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Поиск публичных каналов.
   *
   * @tags Chat
   * @name SearchChannels
   * @summary Поиск каналов
   * @request GET:/api/chat/channel/search
   * @secure
   */
  searchChannels = (query: SearchChannelsParams, params: RequestParams = {}) =>
    this.request<IChatListDto>({
      url: `/api/chat/channel/search`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить список чатов текущего пользователя.
   *
   * @tags Chat
   * @name GetUserChats
   * @summary Список чатов
   * @request GET:/api/chat
   * @secure
   */
  getUserChats = (query: GetUserChatsParams, params: RequestParams = {}) =>
    this.request<IChatListDto>({
      url: `/api/chat`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить информацию о чате.
   *
   * @tags Chat
   * @name GetChatById
   * @summary Получение чата
   * @request GET:/api/chat/{id}
   * @secure
   */
  getChatById = (
    { id, ...query }: GetChatByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<ChatDto>({
      url: `/api/chat/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить групповой чат (название, аватар).
   *
   * @tags Chat
   * @name UpdateChat
   * @summary Обновление чата
   * @request PATCH:/api/chat/{id}
   * @secure
   */
  updateChat = (
    { id, ...query }: UpdateChatParams,
    data: IUpdateChatBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatDto>({
      url: `/api/chat/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Покинуть чат.
   *
   * @tags Chat
   * @name LeaveChat
   * @summary Выход из чата
   * @request DELETE:/api/chat/{id}
   * @secure
   */
  leaveChat = ({ id, ...query }: LeaveChatParams, params: RequestParams = {}) =>
    this.request<Base64URLString>({
      url: `/api/chat/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать invite-ссылку для группового чата.
   *
   * @tags Chat
   * @name CreateInviteLink
   * @summary Создание invite-ссылки
   * @request POST:/api/chat/{id}/invite
   * @secure
   */
  createInviteLink = (
    { id, ...query }: CreateInviteLinkParams,
    data: ICreateInviteBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatInviteDto>({
      url: `/api/chat/${id}/invite`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить список invite-ссылок чата.
   *
   * @tags Chat
   * @name GetInvites
   * @summary Список invite-ссылок
   * @request GET:/api/chat/{id}/invite
   * @secure
   */
  getInvites = (
    { id, ...query }: GetInvitesParams,
    params: RequestParams = {},
  ) =>
    this.request<ChatInviteDto[]>({
      url: `/api/chat/${id}/invite`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отозвать invite-ссылку.
   *
   * @tags Chat
   * @name RevokeInvite
   * @summary Отзыв invite-ссылки
   * @request DELETE:/api/chat/{id}/invite/{inviteId}
   * @secure
   */
  revokeInvite = (
    { id, inviteId, ...query }: RevokeInviteParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/chat/${id}/invite/${inviteId}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Присоединиться к чату по invite-коду.
   *
   * @tags Chat
   * @name JoinByInvite
   * @summary Вступление по invite-ссылке
   * @request POST:/api/chat/join/{code}
   * @secure
   */
  joinByInvite = (
    { code, ...query }: JoinByInviteParams,
    params: RequestParams = {},
  ) =>
    this.request<ChatDto>({
      url: `/api/chat/join/${code}`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Замутить или размутить чат.
   *
   * @tags Chat
   * @name MuteChat
   * @summary Мут чата
   * @request PATCH:/api/chat/{id}/mute
   * @secure
   */
  muteChat = (
    { id, ...query }: MuteChatParams,
    data: IMuteChatBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatMemberDto>({
      url: `/api/chat/${id}/mute`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Добавить участников в групповой чат.
   *
   * @tags Chat
   * @name AddMembers
   * @summary Добавление участников
   * @request POST:/api/chat/{id}/members
   * @secure
   */
  addMembers = (
    { id, ...query }: AddMembersParams,
    data: IAddMembersBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatMemberDto[]>({
      url: `/api/chat/${id}/members`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить участника из группового чата.
   *
   * @tags Chat
   * @name RemoveMember
   * @summary Удаление участника
   * @request DELETE:/api/chat/{id}/members/{userId}
   * @secure
   */
  removeMember = (
    { id, userId, ...query }: RemoveMemberParams,
    params: RequestParams = {},
  ) =>
    this.request<Base64URLString>({
      url: `/api/chat/${id}/members/${userId}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Изменить роль участника в групповом чате.
   *
   * @tags Chat
   * @name UpdateMemberRole
   * @summary Изменение роли участника
   * @request PATCH:/api/chat/{id}/members/{userId}
   * @secure
   */
  updateMemberRole = (
    { id, userId, ...query }: UpdateMemberRoleParams,
    data: IUpdateMemberRoleBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatMemberDto>({
      url: `/api/chat/${id}/members/${userId}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Закрепить чат.
   *
   * @tags Chat
   * @name PinChat
   * @summary Закрепление чата
   * @request POST:/api/chat/{id}/pin
   * @secure
   */
  pinChat = ({ id, ...query }: PinChatParams, params: RequestParams = {}) =>
    this.request<ChatMemberDto>({
      url: `/api/chat/${id}/pin`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Открепить чат.
   *
   * @tags Chat
   * @name UnpinChat
   * @summary Открепление чата
   * @request DELETE:/api/chat/{id}/pin
   * @secure
   */
  unpinChat = ({ id, ...query }: UnpinChatParams, params: RequestParams = {}) =>
    this.request<ChatMemberDto>({
      url: `/api/chat/${id}/pin`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Переместить чат в папку.
   *
   * @tags Chat
   * @name MoveChatToFolder
   * @summary Перемещение в папку
   * @request PATCH:/api/chat/{id}/folder
   * @secure
   */
  moveChatToFolder = (
    { id, ...query }: MoveChatToFolderParams,
    data: IMoveChatToFolderBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatMemberDto>({
      url: `/api/chat/${id}/folder`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить список папок чатов.
   *
   * @tags Chat
   * @name GetUserFolders
   * @summary Список папок
   * @request GET:/api/chat/folder/list
   * @secure
   */
  getUserFolders = (params: RequestParams = {}) =>
    this.request<ChatFolderDto[]>({
      url: `/api/chat/folder/list`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать папку для чатов.
   *
   * @tags Chat
   * @name CreateFolder
   * @summary Создание папки
   * @request POST:/api/chat/folder
   * @secure
   */
  createFolder = (data: ICreateFolderBody, params: RequestParams = {}) =>
    this.request<ChatFolderDto>({
      url: `/api/chat/folder`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить папку.
   *
   * @tags Chat
   * @name UpdateFolder
   * @summary Обновление папки
   * @request PATCH:/api/chat/folder/{folderId}
   * @secure
   */
  updateFolder = (
    { folderId, ...query }: UpdateFolderParams,
    data: IUpdateFolderBody,
    params: RequestParams = {},
  ) =>
    this.request<ChatFolderDto>({
      url: `/api/chat/folder/${folderId}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить папку.
   *
   * @tags Chat
   * @name DeleteFolder
   * @summary Удаление папки
   * @request DELETE:/api/chat/folder/{folderId}
   * @secure
   */
  deleteFolder = (
    { folderId, ...query }: DeleteFolderParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/chat/folder/${folderId}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Добавить контакт.
   *
   * @tags Contact
   * @name AddContact
   * @summary Добавление контакта
   * @request POST:/api/contact
   * @secure
   */
  addContact = (data: ICreateContactBody, params: RequestParams = {}) =>
    this.request<ContactDto>({
      url: `/api/contact`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить список контактов текущего пользователя.
   *
   * @tags Contact
   * @name GetContacts
   * @summary Список контактов
   * @request GET:/api/contact
   * @secure
   */
  getContacts = (query: GetContactsParams, params: RequestParams = {}) =>
    this.request<ContactDto[]>({
      url: `/api/contact`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Принять запрос на добавление в контакты.
   *
   * @tags Contact
   * @name AcceptContact
   * @summary Принять контакт
   * @request PATCH:/api/contact/{id}/accept
   * @secure
   */
  acceptContact = (
    { id, ...query }: AcceptContactParams,
    params: RequestParams = {},
  ) =>
    this.request<ContactDto>({
      url: `/api/contact/${id}/accept`,
      method: "PATCH",
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить контакт.
   *
   * @tags Contact
   * @name RemoveContact
   * @summary Удаление контакта
   * @request DELETE:/api/contact/{id}
   * @secure
   */
  removeContact = (
    { id, ...query }: RemoveContactParams,
    params: RequestParams = {},
  ) =>
    this.request<Base64URLString>({
      url: `/api/contact/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Заблокировать контакт.
   *
   * @tags Contact
   * @name BlockContact
   * @summary Блокировка контакта
   * @request POST:/api/contact/{id}/block
   * @secure
   */
  blockContact = (
    { id, ...query }: BlockContactParams,
    params: RequestParams = {},
  ) =>
    this.request<ContactDto>({
      url: `/api/contact/${id}/block`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить файл по ID. Этот эндпоинт позволяет пользователю получить файл по его уникальному ID. Он защищен с использованием JWT-аутентификации, что означает, что только аутентифицированные пользователи могут получить доступ к этому ресурсу.
   *
   * @tags Files
   * @name GetFileById
   * @summary Получение файла по ID
   * @request GET:/api/file
   * @secure
   */
  getFileById = (query: GetFileByIdParams, params: RequestParams = {}) =>
    this.request<IFileDto>({
      url: `/api/file`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Загрузить файл. Этот эндпоинт позволяет пользователю загрузить один файл на сервер. Он защищен с использованием JWT-аутентификации, что означает, что только аутентифицированные пользователи могут загружать файлы.
   *
   * @tags Files
   * @name UploadFile
   * @summary Загрузка файла
   * @request POST:/api/file
   * @secure
   */
  uploadFile = (data: UploadFilePayload, params: RequestParams = {}) =>
    this.request<IFileDto[]>({
      url: `/api/file`,
      method: "POST",
      data: data,
      type: EContentType.FormData,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить файл. Этот эндпоинт позволяет пользователю удалить файл по его ID. Доступ разрешен только пользователю, который загрузил файл, либо администратору.
   *
   * @tags Files
   * @name DeleteFile
   * @summary Удаление файла
   * @request DELETE:/api/file/{id}
   * @secure
   */
  deleteFile = (
    { id, ...query }: DeleteFileParams,
    params: RequestParams = {},
  ) =>
    this.request<boolean>({
      url: `/api/file/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отправить сообщение в чат.
   *
   * @tags Message
   * @name SendMessage
   * @summary Отправка сообщения
   * @request POST:/api/chat/{chatId}/message
   * @secure
   */
  sendMessage = (
    { chatId, ...query }: SendMessageParams,
    data: ISendMessageBody,
    params: RequestParams = {},
  ) =>
    this.request<MessageDto>({
      url: `/api/chat/${chatId}/message`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить сообщения чата с cursor-based пагинацией. - `before` — загрузить старые сообщения (скролл вверх) - `after` — загрузить новые сообщения (скролл вниз из detached окна) - `around` — загрузить окно вокруг конкретного сообщения (навигация) - без параметров — последние сообщения
   *
   * @tags Message
   * @name GetMessages
   * @summary Список сообщений
   * @request GET:/api/chat/{chatId}/message
   * @secure
   */
  getMessages = (
    { chatId, ...query }: GetMessagesParams,
    params: RequestParams = {},
  ) =>
    this.request<IMessageListDto>({
      url: `/api/chat/${chatId}/message`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Поиск сообщений в чате.
   *
   * @tags Message
   * @name SearchMessages
   * @summary Поиск в чате
   * @request GET:/api/chat/{chatId}/message/search
   * @secure
   */
  searchMessages = (
    { chatId, ...query }: SearchMessagesParams,
    params: RequestParams = {},
  ) =>
    this.request<IMessageSearchDto>({
      url: `/api/chat/${chatId}/message/search`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить закреплённые сообщения чата.
   *
   * @tags Message
   * @name GetPinnedMessages
   * @summary Закреплённые сообщения
   * @request GET:/api/chat/{chatId}/message/pinned
   * @secure
   */
  getPinnedMessages = (
    { chatId, ...query }: GetPinnedMessagesParams,
    params: RequestParams = {},
  ) =>
    this.request<MessageDto[]>({
      url: `/api/chat/${chatId}/message/pinned`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить медиафайлы чата.
   *
   * @tags Message
   * @name GetChatMedia
   * @summary Медиа-галерея чата
   * @request GET:/api/chat/{chatId}/media
   * @secure
   */
  getChatMedia = (
    { chatId, ...query }: GetChatMediaParams,
    params: RequestParams = {},
  ) =>
    this.request<IMediaGalleryDto>({
      url: `/api/chat/${chatId}/media`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить статистику медиафайлов чата.
   *
   * @tags Message
   * @name GetChatMediaStats
   * @summary Статистика медиа
   * @request GET:/api/chat/{chatId}/media/stats
   * @secure
   */
  getChatMediaStats = (
    { chatId, ...query }: GetChatMediaStatsParams,
    params: RequestParams = {},
  ) =>
    this.request<IMediaStatsDto>({
      url: `/api/chat/${chatId}/media/stats`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отметить сообщения как прочитанные до указанного messageId.
   *
   * @tags Message
   * @name MarkAsRead
   * @summary Прочитать сообщения
   * @request POST:/api/chat/{chatId}/message/read
   * @secure
   */
  markAsRead = (
    { chatId, ...query }: MarkAsReadParams,
    data: IMarkReadBody,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/chat/${chatId}/message/read`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      ...params,
    });
  /**
   * @description Глобальный поиск по сообщениям во всех чатах пользователя.
   *
   * @tags Message
   * @name SearchMessages2
   * @summary Глобальный поиск сообщений
   * @request GET:/api/message/search
   * @originalName searchMessages
   * @duplicate
   * @secure
   */
  searchMessages2 = (
    query: SearchMessages2Params,
    params: RequestParams = {},
  ) =>
    this.request<IMessageSearchDto>({
      url: `/api/message/search`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Отредактировать сообщение.
   *
   * @tags Message
   * @name EditMessage
   * @summary Редактирование сообщения
   * @request PATCH:/api/message/{id}
   * @secure
   */
  editMessage = (
    { id, ...query }: EditMessageParams,
    data: IEditMessageBody,
    params: RequestParams = {},
  ) =>
    this.request<MessageDto>({
      url: `/api/message/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить сообщение (soft delete).
   *
   * @tags Message
   * @name DeleteMessage
   * @summary Удаление сообщения
   * @request DELETE:/api/message/{id}
   * @secure
   */
  deleteMessage = (
    { id, ...query }: DeleteMessageParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/message/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Добавить реакцию на сообщение.
   *
   * @tags Message
   * @name AddReaction
   * @summary Добавление реакции
   * @request POST:/api/message/{id}/reaction
   * @secure
   */
  addReaction = (
    { id, ...query }: AddReactionParams,
    data: IAddReactionBody,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/message/${id}/reaction`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      ...params,
    });
  /**
   * @description Удалить реакцию с сообщения.
   *
   * @tags Message
   * @name RemoveReaction
   * @summary Удаление реакции
   * @request DELETE:/api/message/{id}/reaction
   * @secure
   */
  removeReaction = (
    { id, ...query }: RemoveReactionParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/message/${id}/reaction`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Закрепить сообщение.
   *
   * @tags Message
   * @name PinMessage
   * @summary Закрепление сообщения
   * @request POST:/api/message/{id}/pin
   * @secure
   */
  pinMessage = (
    { id, ...query }: PinMessageParams,
    params: RequestParams = {},
  ) =>
    this.request<MessageDto>({
      url: `/api/message/${id}/pin`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Открепить сообщение.
   *
   * @tags Message
   * @name UnpinMessage
   * @summary Открепление сообщения
   * @request DELETE:/api/message/{id}/pin
   * @secure
   */
  unpinMessage = (
    { id, ...query }: UnpinMessageParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/message/${id}/pin`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Генерирует параметры для регистрации нового passkey. Требует авторизации — passkey привязывается к текущему пользователю.
   *
   * @tags Passkeys
   * @name GenerateRegistrationOptions
   * @summary Параметры регистрации passkey
   * @request POST:/api/passkeys/generate-registration-options
   * @secure
   */
  generateRegistrationOptions = (params: RequestParams = {}) =>
    this.request<PublicKeyCredentialCreationOptionsJSON>({
      url: `/api/passkeys/generate-registration-options`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Верифицирует ответ устройства и сохраняет passkey для текущего пользователя.
   *
   * @tags Passkeys
   * @name VerifyRegistration
   * @summary Верификация регистрации passkey
   * @request POST:/api/passkeys/verify-registration
   * @secure
   */
  verifyRegistration = (
    data: IVerifyRegistrationRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IVerifyRegistrationResponseDto>({
      url: `/api/passkeys/verify-registration`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Генерирует параметры для аутентификации по passkey. Принимает login (email или телефон) пользователя.
   *
   * @tags Passkeys
   * @name GenerateAuthenticationOptions
   * @summary Параметры аутентификации passkey
   * @request POST:/api/passkeys/generate-authentication-options
   */
  generateAuthenticationOptions = (
    data: IGenerateAuthenticationOptionsRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<PublicKeyCredentialRequestOptionsJSON>({
      url: `/api/passkeys/generate-authentication-options`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Верифицирует ответ устройства и возвращает токены при успехе.
   *
   * @tags Passkeys
   * @name VerifyAuthentication
   * @summary Аутентификация по passkey
   * @request POST:/api/passkeys/verify-authentication
   */
  verifyAuthentication = (
    data: IVerifyAuthenticationRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IVerifyAuthenticationResponseDto>({
      url: `/api/passkeys/verify-authentication`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Создать опрос в чате.
   *
   * @tags Poll
   * @name CreatePoll
   * @summary Создание опроса
   * @request POST:/api/chat/{chatId}/poll
   * @secure
   */
  createPoll = (
    { chatId, ...query }: CreatePollParams,
    data: ICreatePollBody,
    params: RequestParams = {},
  ) =>
    this.request<PollDto>({
      url: `/api/chat/${chatId}/poll`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Проголосовать в опросе.
   *
   * @tags Poll
   * @name Vote
   * @summary Голосование
   * @request POST:/api/poll/{id}/vote
   * @secure
   */
  vote = (
    { id, ...query }: VoteParams,
    data: IVotePollBody,
    params: RequestParams = {},
  ) =>
    this.request<PollDto>({
      url: `/api/poll/${id}/vote`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Отозвать голос.
   *
   * @tags Poll
   * @name RetractVote
   * @summary Отзыв голоса
   * @request DELETE:/api/poll/{id}/vote
   * @secure
   */
  retractVote = (
    { id, ...query }: RetractVoteParams,
    params: RequestParams = {},
  ) =>
    this.request<PollDto>({
      url: `/api/poll/${id}/vote`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Закрыть опрос.
   *
   * @tags Poll
   * @name ClosePoll
   * @summary Закрытие опроса
   * @request POST:/api/poll/{id}/close
   * @secure
   */
  closePoll = ({ id, ...query }: ClosePollParams, params: RequestParams = {}) =>
    this.request<PollDto>({
      url: `/api/poll/${id}/close`,
      method: "POST",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить опрос по ID.
   *
   * @tags Poll
   * @name GetPoll
   * @summary Получение опроса
   * @request GET:/api/poll/{id}
   * @secure
   */
  getPoll = ({ id, ...query }: GetPollParams, params: RequestParams = {}) =>
    this.request<PollDto>({
      url: `/api/poll/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Зарегистрировать устройство для push-уведомлений.
   *
   * @tags Push
   * @name RegisterDevice
   * @summary Регистрация устройства
   * @request POST:/api/device
   * @secure
   */
  registerDevice = (data: IRegisterDeviceBody, params: RequestParams = {}) =>
    this.request<DeviceTokenDto>({
      url: `/api/device`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить устройство из push-уведомлений.
   *
   * @tags Push
   * @name UnregisterDevice
   * @summary Удаление устройства
   * @request DELETE:/api/device/{token}
   * @secure
   */
  unregisterDevice = (
    { token, ...query }: UnregisterDeviceParams,
    params: RequestParams = {},
  ) =>
    this.request<void>({
      url: `/api/device/${token}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Получить настройки уведомлений текущего пользователя.
   *
   * @tags Push
   * @name GetSettings
   * @summary Настройки уведомлений
   * @request GET:/api/notification/settings
   * @secure
   */
  getSettings = (params: RequestParams = {}) =>
    this.request<NotificationSettingsDto>({
      url: `/api/notification/settings`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновить настройки уведомлений.
   *
   * @tags Push
   * @name UpdateSettings
   * @summary Обновление настроек уведомлений
   * @request PATCH:/api/notification/settings
   * @secure
   */
  updateSettings = (
    data: IUpdateNotificationSettingsBody,
    params: RequestParams = {},
  ) =>
    this.request<NotificationSettingsDto>({
      url: `/api/notification/settings`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить изменения с указанной версии.
   *
   * @tags Sync
   * @name GetChanges
   * @summary Incremental sync
   * @request GET:/api/sync
   * @secure
   */
  getChanges = (query: GetChangesParams, params: RequestParams = {}) =>
    this.request<ISyncResponseDto>({
      url: `/api/sync`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
}
