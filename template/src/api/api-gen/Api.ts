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
  ApiResponseDto,
  Base64URLString,
  BlockContactParams,
  ChatDto,
  ChatMemberDto,
  ContactDto,
  DeleteDeviceParams,
  DeleteFileParams,
  DeleteMessageParams,
  DeleteProfileParams,
  DeleteUserParams,
  DeviceTokenDto,
  EditMessageParams,
  GetChatByIdParams,
  GetContactsParams,
  GetFileByIdParams,
  GetMessagesParams,
  GetProfileByIdParams,
  GetProfilesParams,
  GetUserByIdParams,
  GetUserChatsParams,
  GetUserOptionsParams,
  GetUsersParams,
  IAddMembersBody,
  IBiometricDevicesResponseDto,
  IChatListDto,
  ICreateContactBody,
  ICreateDirectChatBody,
  ICreateGroupChatBody,
  IDeleteBiometricResponseDto,
  IEditMessageBody,
  IFileDto,
  IGenerateAuthenticationOptionsRequestDto,
  IGenerateNonceRequestDto,
  IGenerateNonceResponseDto,
  IMarkReadBody,
  IMessageListDto,
  IProfileListDto,
  IProfileUpdateRequestDto,
  IRegisterBiometricRequestDto,
  IRegisterBiometricResponseDto,
  IRegisterDeviceBody,
  IRoleDto,
  IRolePermissionsRequestDto,
  ISendMessageBody,
  ISignInRequestDto,
  ITokensDto,
  IUpdateChatBody,
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
  IVerifyAuthenticationRequestDto,
  IVerifyAuthenticationResponseDto,
  IVerifyBiometricSignatureRequestDto,
  IVerifyBiometricSignatureResponseDto,
  IVerifyRegistrationRequestDto,
  IVerifyRegistrationResponseDto,
  LeaveChatParams,
  MarkAsReadParams,
  MessageDto,
  NotificationSettingsDto,
  ProfileDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicProfileDto,
  RefreshPayload,
  RemoveContactParams,
  RemoveMemberParams,
  SendMessageParams,
  SetPrivilegesParams,
  SetRolePermissionsParams,
  TSignUpRequestDto,
  UnregisterDeviceParams,
  UpdateChatParams,
  UpdateMemberRoleParams,
  UpdateProfileParams,
  UpdateUserParams,
  UploadFilePayload,
  UserDto,
  VerifyEmailParams,
} from "./data-contracts";
import { EContentType, HttpClient, RequestParams } from "./http-client";

export class Api<E = unknown> extends HttpClient<E> {
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
    this.request<IUserWithTokensDto>({
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
   * @description Получить сообщения чата с cursor-based пагинацией.
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
}
