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

import type { AxiosError } from "axios";
import {
  AddAvatarPayload,
  ApiResponseDto,
  AuthenticatePayload,
  Base64URLString,
  COSEAlgorithmIdentifier,
  DialogDetailDto,
  DialogLastMessagesDto,
  DialogMembersDto,
  DialogMessagesDto,
  FcmTokenDto,
  FcmTokenRequestDto,
  GenerateAuthenticationOptionsPayload,
  GenerateRegistrationOptionsPayload,
  GetDialogsParams,
  GetFileByIdParams,
  GetLastMessageParams,
  GetMembersParams,
  GetMessagesParams,
  GetProfilesParams,
  GetTokensParams,
  GetUnreadMessagesCountParams,
  GetUsersParams,
  IDialogCreateRequestDto,
  IDialogFindOrCreateResponseDto,
  IDialogFindRequestDto,
  IDialogFindResponseDto,
  IDialogListDto,
  IDialogListMessagesDto,
  IDialogMembersAddRequestDto,
  IFCMMessageDto,
  IFileDto,
  IGenerateNonceRequestDto,
  IGenerateNonceResponseDto,
  IMessagesRequestDto,
  IMessagesUpdateRequestDto,
  IProfileListDto,
  IProfileUpdateRequestDto,
  IRegisterBiometricRequestDto,
  IRegisterBiometricResponseDto,
  ISignInRequestDto,
  ITokensDto,
  IUserChangePasswordDto,
  IUserListDto,
  IUserLoginRequestDto,
  IUserPrivilegesRequestDto,
  IUserResetPasswordRequestDto,
  IUserUpdateRequestDto,
  IUserWithTokensDto,
  IVerifyAuthenticationRequestDto,
  IVerifyAuthenticationResponseDto,
  IVerifyBiometricSignatureRequestDto,
  IVerifyBiometricSignatureResponseDto,
  IVerifyRegistrationRequestDto,
  ProfileDto,
  PublicKeyCredentialRequestOptionsJSON,
  RefreshPayload,
  RegisterApnPayload,
  TSignUpRequestDto,
  UploadFilePayload,
  UserDto,
} from "./data-contracts";
import { EContentType, HttpClient, RequestParams } from "./http-client";

export class Api<
  E extends Error | AxiosError<EBody> = AxiosError<unknown>,
  EBody = unknown,
> extends HttpClient<E, EBody> {
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
    this.request<IFileDto, any>({
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
    this.request<IFileDto[], any>({
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
  deleteFile = (id: string, params: RequestParams = {}) =>
    this.request<boolean, any>({
      url: `/api/file/${id}`,
      method: "DELETE",
      responseType: "json",
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
    this.request<ProfileDto, any>({
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
    this.request<ProfileDto, any>({
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
    this.request<Base64URLString, any>({
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
    this.request<IProfileListDto, any>({
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
  getProfileById = (userId: string, params: RequestParams = {}) =>
    this.request<ProfileDto, any>({
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
    userId: string,
    data: IProfileUpdateRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<ProfileDto, any>({
      url: `/api/profile/update/${userId}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Загрузить аватар для текущего пользователя. Этот эндпоинт позволяет пользователю загрузить аватар для своего профиля.
   *
   * @tags Profile
   * @name AddAvatar
   * @summary Загрузка аватара
   * @request POST:/api/profile/avatar/upload
   * @secure
   */
  addAvatar = (data: AddAvatarPayload, params: RequestParams = {}) =>
    this.request<ProfileDto, any>({
      url: `/api/profile/avatar/upload`,
      method: "POST",
      data: data,
      type: EContentType.FormData,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удалить аватар пользователя. Этот эндпоинт позволяет пользователю удалить свой аватар.
   *
   * @tags Profile
   * @name RemoveAvatar
   * @summary Удаление аватара
   * @request DELETE:/api/profile/avatar
   * @secure
   */
  removeAvatar = (params: RequestParams = {}) =>
    this.request<ProfileDto, any>({
      url: `/api/profile/avatar`,
      method: "DELETE",
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
  deleteProfile = (userId: string, params: RequestParams = {}) =>
    this.request<Base64URLString, any>({
      url: `/api/profile/delete/${userId}`,
      method: "DELETE",
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
    this.request<UserDto, any>({
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
    this.request<UserDto, any>({
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
    this.request<boolean, any>({
      url: `/api/user/my/delete`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получить всех пользователей. Этот эндпоинт позволяет администраторам получить список всех пользователей системы. Он поддерживает пагинацию через параметры `offset` и `limit`.
   *
   * @tags User
   * @name GetUsers
   * @summary Получение всех пользователей
   * @request GET:/api/user/all
   * @secure
   */
  getUsers = (query: GetUsersParams, params: RequestParams = {}) =>
    this.request<IUserListDto, any>({
      url: `/api/user/all`,
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
  getUserById = (id: string, params: RequestParams = {}) =>
    this.request<UserDto, any>({
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
    id: string,
    data: IUserPrivilegesRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<UserDto, any>({
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
    this.request<boolean, any>({
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
  verifyEmail = (code: string, params: RequestParams = {}) =>
    this.request<ApiResponseDto, any>({
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
    id: string,
    data: IUserUpdateRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<UserDto, any>({
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
    this.request<ApiResponseDto, any>({
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
  deleteUser = (id: string, params: RequestParams = {}) =>
    this.request<boolean, any>({
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
    this.request<IUserWithTokensDto, any>({
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
    this.request<IUserWithTokensDto, any>({
      url: `/api/auth/sign-in`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Авторизация пользователя через OAuth code GitHub
   *
   * @tags Authorization
   * @name Authenticate
   * @summary Вход в систему
   * @request POST:/api/auth/authenticate
   */
  authenticate = (data: AuthenticatePayload, params: RequestParams = {}) =>
    this.request<IUserWithTokensDto, any>({
      url: `/api/auth/authenticate`,
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
    this.request<ApiResponseDto, any>({
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
    this.request<ApiResponseDto, any>({
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
    this.request<ITokensDto, any>({
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
   */
  registerBiometric = (
    data: IRegisterBiometricRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IRegisterBiometricResponseDto, any>({
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
   */
  generateNonce = (
    data: IGenerateNonceRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IGenerateNonceResponseDto, any>({
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
   */
  verifySignature = (
    data: IVerifyBiometricSignatureRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IVerifyBiometricSignatureResponseDto, any>({
      url: `/api/biometric/verify-signature`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Регистрирует APN-токены (Apple Push Notification) для iOS-устройств.
   *
   * @tags FCM
   * @name RegisterApn
   * @summary Регистрация APN-токенов
   * @request POST:/api/fcm/register-apn-token
   * @secure
   */
  registerApn = (data: RegisterApnPayload, params: RequestParams = {}) =>
    this.request<string[], any>({
      url: `/api/fcm/register-apn-token`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Отправляет push-уведомление через Firebase Cloud Messaging (FCM).
   *
   * @tags FCM
   * @name SendPushNotification
   * @summary Отправка push-уведомления
   * @request POST:/api/fcm/push
   * @secure
   */
  sendPushNotification = (data: IFCMMessageDto, params: RequestParams = {}) =>
    this.request<Base64URLString, any>({
      url: `/api/fcm/push`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает все FCM-токены пользователя по его `userId`.
   *
   * @tags FCM
   * @name GetTokens
   * @summary Получение токенов по `userId`
   * @request GET:/api/fcm/tokens
   * @secure
   */
  getTokens = (query: GetTokensParams, params: RequestParams = {}) =>
    this.request<FcmTokenDto[], any>({
      url: `/api/fcm/tokens`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает все FCM-токены текущего аутентифицированного пользователя.
   *
   * @tags FCM
   * @name GetMyTokens
   * @summary Получение токенов текущего пользователя
   * @request GET:/api/fcm/my-tokens
   * @secure
   */
  getMyTokens = (params: RequestParams = {}) =>
    this.request<FcmTokenDto[], any>({
      url: `/api/fcm/my-tokens`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Удаляет все FCM-токены текущего пользователя.
   *
   * @tags FCM
   * @name DeleteTokens
   * @summary Удаление всех токенов пользователя
   * @request DELETE:/api/fcm/my-tokens
   * @secure
   */
  deleteTokens = (params: RequestParams = {}) =>
    this.request<boolean, any>({
      url: `/api/fcm/my-tokens`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает FCM-токен по его ID.
   *
   * @tags FCM
   * @name GetToken
   * @summary Получение токена по `id`
   * @request GET:/api/fcm/token/{id}
   * @secure
   */
  getToken = (id: number, params: RequestParams = {}) =>
    this.request<FcmTokenDto, any>({
      url: `/api/fcm/token/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Удаляет FCM-токен по его `id`.
   *
   * @tags FCM
   * @name DeleteToken
   * @summary Удаление токена
   * @request DELETE:/api/fcm/token/{id}
   * @secure
   */
  deleteToken = (id: number, params: RequestParams = {}) =>
    this.request<boolean, any>({
      url: `/api/fcm/token/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Добавляет новый FCM-токен для текущего пользователя.
   *
   * @tags FCM
   * @name AddToken
   * @summary Добавление FCM-токена
   * @request POST:/api/fcm/token
   * @secure
   */
  addToken = (data: FcmTokenRequestDto, params: RequestParams = {}) =>
    this.request<FcmTokenDto, any>({
      url: `/api/fcm/token`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает количество непрочитанных сообщений пользователя.
   *
   * @tags Dialog
   * @name GetUnreadMessagesCount
   * @summary Количество непрочитанных сообщений
   * @request GET:/api/dialog/unread-messages-count
   * @secure
   */
  getUnreadMessagesCount = (
    query: GetUnreadMessagesCountParams,
    params: RequestParams = {},
  ) =>
    this.request<COSEAlgorithmIdentifier, any>({
      url: `/api/dialog/unread-messages-count`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает список всех диалогов пользователя.
   *
   * @tags Dialog
   * @name GetDialogs
   * @summary Список диалогов
   * @request GET:/api/dialog/all
   * @secure
   */
  getDialogs = (query: GetDialogsParams, params: RequestParams = {}) =>
    this.request<IDialogListDto, any>({
      url: `/api/dialog/all`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает информацию о конкретном диалоге по ID.
   *
   * @tags Dialog
   * @name GetDialogById
   * @summary Информация о диалоге
   * @request GET:/api/dialog/info/{id}
   * @secure
   */
  getDialogById = (id: string, params: RequestParams = {}) =>
    this.request<DialogDetailDto, any>({
      url: `/api/dialog/info/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Ищет диалог между текущим пользователем и собеседником.
   *
   * @tags Dialog
   * @name GetPrivateDialogWithUser
   * @summary Поиск диалога
   * @request GET:/api/dialog/private-with/{userId}
   * @secure
   */
  getPrivateDialogWithUser = (userId: string, params: RequestParams = {}) =>
    this.request<IDialogFindResponseDto, any>({
      url: `/api/dialog/private-with/${userId}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Ищет диалог между текущим пользователем и другим участником.
   *
   * @tags Dialog
   * @name FindDialog
   * @summary Поиск диалога
   * @request POST:/api/dialog/find
   * @secure
   */
  findDialog = (data: IDialogFindRequestDto, params: RequestParams = {}) =>
    this.request<IDialogFindResponseDto, any>({
      url: `/api/dialog/find`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Ищет диалог или создает если не найден.
   *
   * @tags Dialog
   * @name FindOrCreate
   * @summary Поиск или создание диалога
   * @request POST:/api/dialog/findOrCreate
   * @secure
   */
  findOrCreate = (data: IDialogFindRequestDto, params: RequestParams = {}) =>
    this.request<IDialogFindOrCreateResponseDto, any>({
      url: `/api/dialog/findOrCreate`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Создает новый диалог.
   *
   * @tags Dialog
   * @name CreateDialog
   * @summary Создание диалога
   * @request POST:/api/dialog
   * @secure
   */
  createDialog = (data: IDialogCreateRequestDto, params: RequestParams = {}) =>
    this.request<DialogDetailDto, any>({
      url: `/api/dialog`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает список участников диалога.
   *
   * @tags Dialog
   * @name GetMembers
   * @summary Участники диалога
   * @request GET:/api/dialog/members
   * @secure
   */
  getMembers = (query: GetMembersParams, params: RequestParams = {}) =>
    this.request<DialogMembersDto[], any>({
      url: `/api/dialog/members`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Добавляет новых участников в диалог.
   *
   * @tags Dialog
   * @name AddMembers
   * @summary Добавление участников
   * @request POST:/api/dialog/member
   * @secure
   */
  addMembers = (
    data: IDialogMembersAddRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<DialogMembersDto[], any>({
      url: `/api/dialog/member`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удаляет участника из диалога.
   *
   * @tags Dialog
   * @name DeleteMember
   * @summary Удаление участника
   * @request DELETE:/api/dialog/member/{id}
   * @secure
   */
  deleteMember = (id: string, params: RequestParams = {}) =>
    this.request<boolean, any>({
      url: `/api/dialog/member/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Удаляет диалог.
   *
   * @tags Dialog
   * @name RemoveDialog
   * @summary Удаление диалога
   * @request DELETE:/api/dialog/{id}
   * @secure
   */
  removeDialog = (id: string, params: RequestParams = {}) =>
    this.request<void, any>({
      url: `/api/dialog/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Получает сообщения диалога с пагинацией.
   *
   * @tags Dialog
   * @name GetMessages
   * @summary Получение сообщений
   * @request GET:/api/dialog/message/all
   * @secure
   */
  getMessages = (query: GetMessagesParams, params: RequestParams = {}) =>
    this.request<IDialogListMessagesDto, any>({
      url: `/api/dialog/message/all`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает последнее сообщение в диалоге.
   *
   * @tags Dialog
   * @name GetLastMessage
   * @summary Последнее сообщение
   * @request GET:/api/dialog/message/last-message
   * @secure
   */
  getLastMessage = (query: GetLastMessageParams, params: RequestParams = {}) =>
    this.request<DialogLastMessagesDto[], any>({
      url: `/api/dialog/message/last-message`,
      method: "GET",
      params: query,
      responseType: "json",
      ...params,
    });
  /**
   * @description Получает сообщение по ID.
   *
   * @tags Dialog
   * @name GetMessageById
   * @summary Получение сообщения по ID
   * @request GET:/api/dialog/message/{id}
   * @secure
   */
  getMessageById = (id: string, params: RequestParams = {}) =>
    this.request<DialogMessagesDto, any>({
      url: `/api/dialog/message/${id}`,
      method: "GET",
      responseType: "json",
      ...params,
    });
  /**
   * @description Обновляет существующее сообщение в диалоге.
   *
   * @tags Dialog
   * @name UpdateMessage
   * @summary Обновление сообщения
   * @request PATCH:/api/dialog/message/{id}
   * @secure
   */
  updateMessage = (
    id: string,
    data: IMessagesUpdateRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<DialogMessagesDto, any>({
      url: `/api/dialog/message/${id}`,
      method: "PATCH",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Удаляет сообщение из диалога.
   *
   * @tags Dialog
   * @name DeleteMessage
   * @summary Удаление сообщения
   * @request DELETE:/api/dialog/message/{id}
   * @secure
   */
  deleteMessage = (id: string, params: RequestParams = {}) =>
    this.request<boolean, any>({
      url: `/api/dialog/message/${id}`,
      method: "DELETE",
      responseType: "json",
      ...params,
    });
  /**
   * @description Отправляет новое сообщение в диалог.
   *
   * @tags Dialog
   * @name NewMessage
   * @summary Отправка сообщения
   * @request POST:/api/dialog/message
   * @secure
   */
  newMessage = (data: IMessagesRequestDto, params: RequestParams = {}) =>
    this.request<DialogMessagesDto, any>({
      url: `/api/dialog/message`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Генерирует параметры для регистрации нового устройства с использованием Passkeys. Этот эндпоинт используется для создания параметров, которые будут отправлены клиенту для регистрации нового устройства. Клиент должен будет выполнить регистрацию, используя данные сгенерированные этим запросом.
   *
   * @tags Passkeys
   * @name GenerateRegistrationOptions
   * @summary Генерация параметров регистрации
   * @request POST:/api/passkeys/generate-registration-options
   */
  generateRegistrationOptions = (
    data: GenerateRegistrationOptionsPayload,
    params: RequestParams = {},
  ) =>
    this.request<PublicKeyCredentialRequestOptionsJSON, any>({
      url: `/api/passkeys/generate-registration-options`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Проверяет данные регистрации для нового устройства. Этот эндпоинт используется для подтверждения данных, которые были отправлены клиентом после попытки регистрации нового устройства. Он валидирует предоставленные данные и завершает процесс регистрации.
   *
   * @tags Passkeys
   * @name VerifyRegistration
   * @summary Проверка данных регистрации
   * @request POST:/api/passkeys/verify-registration
   */
  verifyRegistration = (
    data: IVerifyRegistrationRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<
      {
        verified: boolean;
      },
      any
    >({
      url: `/api/passkeys/verify-registration`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Генерирует параметры для аутентификации пользователя с использованием Passkeys. Этот эндпоинт создает параметры аутентификации, которые будут отправлены клиенту для выполнения аутентификации с помощью Passkeys. Эти параметры используются клиентом для вызова аутентификации на его устройстве.
   *
   * @tags Passkeys
   * @name GenerateAuthenticationOptions
   * @summary Генерация параметров аутентификации
   * @request POST:/api/passkeys/generate-authentication-options
   */
  generateAuthenticationOptions = (
    data: GenerateAuthenticationOptionsPayload,
    params: RequestParams = {},
  ) =>
    this.request<PublicKeyCredentialRequestOptionsJSON, any>({
      url: `/api/passkeys/generate-authentication-options`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
  /**
   * @description Проверяет данные аутентификации для пользователя. Этот эндпоинт проверяет данные аутентификации, которые были отправлены с клиентской стороны, и завершается успешной или неудачной аутентификацией в зависимости от результатов проверки.
   *
   * @tags Passkeys
   * @name VerifyAuthentication
   * @summary Проверка данных аутентификации
   * @request POST:/api/passkeys/verify-authentication
   */
  verifyAuthentication = (
    data: IVerifyAuthenticationRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<IVerifyAuthenticationResponseDto, any>({
      url: `/api/passkeys/verify-authentication`,
      method: "POST",
      data: data,
      type: EContentType.Json,
      responseType: "json",
      ...params,
    });
}
