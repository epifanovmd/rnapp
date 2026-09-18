import type {
  ApiResponseDto,
  BotCommandDto,
  BotDetailDto,
  BotDto,
  CallDto,
  ChatDto,
  ChatFolderDto,
  ChatInviteDto,
  ChatMemberDto,
  ContactDto,
  DeleteMessageParams,
  DeviceTokenDto,
  GetCallHistoryParams,
  GetChangesParams,
  GetChatMediaParams,
  GetContactsParams,
  GetFileByIdParams,
  GetMessagesParams,
  GetProfilesParams,
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
  ISyncVersionDto,
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
  MessageDto,
  MessageReceiptDto,
  NotificationSettingsDto,
  PollDto,
  PrivacySettingsDto,
  ProfileDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicProfileDto,
  PublicUserDto,
  RefreshBody,
  SearchChannelsParams,
  SearchChatMessagesParams,
  SearchMessagesParams,
  SearchUsersParams,
  SessionDto,
  SetSlowMode200,
  SetUsernameBody,
  TSignUpRequestDto,
  UpdatePrivacySettingsBody,
  UploadFileBody,
  UserDto,
} from "./model";

import { mainMutator } from "../../main/main.mutator";
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getRestApi = () => {
  /**
   * Получить список активных сессий пользователя.
   * @summary Список сессий
   */
  const getSessions = (
    options?: SecondParameter<typeof mainMutator<SessionDto[]>>,
  ) => {
    return mainMutator<SessionDto[]>(
      { url: `/api/session`, method: "GET" },
      options,
    );
  };

  /**
   * Завершить конкретную сессию.
   * @summary Завершение сессии
   */
  const terminateSession = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/session/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Завершить все сессии, кроме текущей.
   * @summary Завершение остальных сессий
   */
  const terminateOtherSessions = (
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/session/terminate-others`, method: "POST" },
      options,
    );
  };

  /**
   * Получить профиль текущего пользователя.
   * Этот эндпоинт позволяет получить данные профиля пользователя, который выполнил запрос.
   * Используется для получения информации о текущем пользователе, например, его имени, email, и других данных.
   * @summary Получение профиля текущего пользователя
   */
  const getMyProfile = (
    options?: SecondParameter<typeof mainMutator<ProfileDto>>,
  ) => {
    return mainMutator<ProfileDto>(
      { url: `/api/profile/my`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить профиль текущего пользователя.
   * Этот эндпоинт позволяет пользователю обновить свои данные, такие как имя, email и другие параметры профиля.
   * @summary Обновление профиля текущего пользователя
   */
  const updateMyProfile = (
    iProfileUpdateRequestDto: IProfileUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<ProfileDto>>,
  ) => {
    return mainMutator<ProfileDto>(
      {
        url: `/api/profile/my/update`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iProfileUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Получить настройки приватности.
   * @summary Настройки приватности
   */
  const getPrivacySettings = (
    options?: SecondParameter<typeof mainMutator<PrivacySettingsDto>>,
  ) => {
    return mainMutator<PrivacySettingsDto>(
      { url: `/api/profile/my/privacy`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить настройки приватности.
   * @summary Обновление настроек приватности
   */
  const updatePrivacySettings = (
    updatePrivacySettingsBody: UpdatePrivacySettingsBody,
    options?: SecondParameter<typeof mainMutator<PrivacySettingsDto>>,
  ) => {
    return mainMutator<PrivacySettingsDto>(
      {
        url: `/api/profile/my/privacy`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: updatePrivacySettingsBody,
      },
      options,
    );
  };

  /**
   * Удалить профиль текущего пользователя.
   * Этот эндпоинт позволяет пользователю удалить свой профиль из системы.
   * @summary Удаление профиля текущего пользователя
   */
  const deleteMyProfile = (
    options?: SecondParameter<typeof mainMutator<string>>,
  ) => {
    return mainMutator<string>(
      { url: `/api/profile/my/delete`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить все профили.
   * Этот эндпоинт позволяет администраторам получить список всех пользователей системы.
   * Он поддерживает пагинацию через параметры `offset` и `limit`.
   * @summary Получение всех профилей
   */
  const getProfiles = (
    params?: GetProfilesParams,
    options?: SecondParameter<typeof mainMutator<IProfileListDto>>,
  ) => {
    return mainMutator<IProfileListDto>(
      { url: `/api/profile/all`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить профиль по ID.
   * Этот эндпоинт позволяет получить профиль другого пользователя по его ID. Доступен только для администраторов.
   * @summary Получение профиля по ID
   */
  const getProfileById = (
    userId: string,
    options?: SecondParameter<typeof mainMutator<PublicProfileDto>>,
  ) => {
    return mainMutator<PublicProfileDto>(
      { url: `/api/profile/${userId}`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить профиль другого пользователя.
   * Этот эндпоинт позволяет администраторам обновлять профиль других пользователей.
   * @summary Обновление профиля другого пользователя
   */
  const updateProfile = (
    userId: string,
    iProfileUpdateRequestDto: IProfileUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<ProfileDto>>,
  ) => {
    return mainMutator<ProfileDto>(
      {
        url: `/api/profile/update/${userId}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iProfileUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Удалить профиль другого пользователя.
   * Этот эндпоинт позволяет администраторам удалить профиль другого пользователя из системы.
   * @summary Удаление профиля другого пользователя
   */
  const deleteProfile = (
    userId: string,
    options?: SecondParameter<typeof mainMutator<string>>,
  ) => {
    return mainMutator<string>(
      { url: `/api/profile/delete/${userId}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить все роли с их правами.
   * @summary Список ролей
   */
  const getRoles = (
    options?: SecondParameter<typeof mainMutator<IRoleDto[]>>,
  ) => {
    return mainMutator<IRoleDto[]>(
      { url: `/api/roles`, method: "GET" },
      options,
    );
  };

  /**
   * Создать новую роль.
   * @summary Создание роли
   */
  const createRole = (
    iCreateRoleRequestDto: ICreateRoleRequestDto,
    options?: SecondParameter<typeof mainMutator<IRoleDto>>,
  ) => {
    return mainMutator<IRoleDto>(
      {
        url: `/api/roles`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateRoleRequestDto,
      },
      options,
    );
  };

  /**
   * Удалить роль.
   * @summary Удаление роли
   */
  const deleteRole = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/roles/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Установить права для роли.
   * Заменяет текущий набор прав роли указанным.
   * @summary Установка прав роли
   */
  const setRolePermissions = (
    id: string,
    iRolePermissionsRequestDto: IRolePermissionsRequestDto,
    options?: SecondParameter<typeof mainMutator<IRoleDto>>,
  ) => {
    return mainMutator<IRoleDto>(
      {
        url: `/api/roles/${id}/permissions`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iRolePermissionsRequestDto,
      },
      options,
    );
  };

  /**
   * Получить пользователя.
   * Этот эндпоинт позволяет получить данные пользователя, который выполнил запрос.
   * @summary Получение данных текущего пользователя
   */
  const getMyUser = (
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      { url: `/api/user/my`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить пользователя.
   * Этот эндпоинт позволяет пользователю обновить свои данные, такие как email, телефон и другие параметры пользователя.
   * @summary Обновление данных текущего пользователя
   */
  const updateMyUser = (
    iUserUpdateRequestDto: IUserUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/user/my/update`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUserUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Удалить текущего пользователя.
   * Этот эндпоинт позволяет удалить пользователя из системы.
   * @summary Удаление текущего пользователя
   */
  const deleteMyUser = (
    options?: SecondParameter<typeof mainMutator<boolean>>,
  ) => {
    return mainMutator<boolean>(
      { url: `/api/user/my/delete`, method: "DELETE" },
      options,
    );
  };

  /**
   * Установить username для текущего пользователя.
   * @summary Установка username
   */
  const setUsername = (
    setUsernameBody: SetUsernameBody,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/user/my/username`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: setUsernameBody,
      },
      options,
    );
  };

  /**
   * Поиск пользователей по запросу (username, email, имя, фамилия).
   * @summary Поиск пользователей
   */
  const searchUsers = (
    params: SearchUsersParams,
    options?: SecondParameter<typeof mainMutator<IUserListDto>>,
  ) => {
    return mainMutator<IUserListDto>(
      { url: `/api/user/search`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить пользователя по username.
   * @summary Получение по username
   */
  const getUserByUsername = (
    username: string,
    options?: SecondParameter<typeof mainMutator<PublicUserDto>>,
  ) => {
    return mainMutator<PublicUserDto>(
      { url: `/api/user/by-username/${username}`, method: "GET" },
      options,
    );
  };

  /**
   * Получить всех пользователей.
   * Поддерживает пагинацию и поиск по email.
   * @summary Получение всех пользователей
   */
  const getUsers = (
    params?: GetUsersParams,
    options?: SecondParameter<typeof mainMutator<IUserListDto>>,
  ) => {
    return mainMutator<IUserListDto>(
      { url: `/api/user/all`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить опции пользователей для выпадающих списков (id + name).
   * name — имя и фамилия или email если профиль не заполнен.
   * @summary Опции пользователей
   */
  const getUserOptions = (
    params?: GetUserOptionsParams,
    options?: SecondParameter<typeof mainMutator<IUserOptionsDto>>,
  ) => {
    return mainMutator<IUserOptionsDto>(
      { url: `/api/user/options`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить пользователя по ID.
   * Этот эндпоинт позволяет получить пользователя по его ID. Доступен только для администраторов.
   * @summary Получение пользователя по ID
   */
  const getUserById = (
    id: string,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      { url: `/api/user/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Установить привилегии для пользователя.
   * Этот эндпоинт позволяет администраторам устанавливать роль и права пользователя.
   * @summary Установка привилегий для пользователя
   */
  const setPrivileges = (
    id: string,
    iUserPrivilegesRequestDto: IUserPrivilegesRequestDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/user/setPrivileges/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUserPrivilegesRequestDto,
      },
      options,
    );
  };

  /**
   * Запросить подтверждение email-адреса для текущего пользователя.
   * Этот эндпоинт позволяет отправить пользователю письмо для подтверждения его email-адреса.
   * @summary Запрос подтверждения email
   */
  const requestVerifyEmail = (
    options?: SecondParameter<typeof mainMutator<boolean>>,
  ) => {
    return mainMutator<boolean>(
      { url: `/api/user/requestVerifyEmail`, method: "POST" },
      options,
    );
  };

  /**
   * Подтвердить email-адрес текущего пользователя по коду.
   * Этот эндпоинт позволяет пользователю подтвердить свой email, используя код, полученный в письме.
   * @summary Подтверждение email-адреса
   */
  const verifyEmail = (
    code: string,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      { url: `/api/user/verifyEmail/${code}`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить пользователя.
   * Этот эндпоинт позволяет администраторам обновлять других пользователей.
   * @summary Обновление другого пользователя
   */
  const updateUser = (
    id: string,
    iUserUpdateRequestDto: IUserUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/user/update/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUserUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Изменить пароль текущего пользователя.
   * Этот эндпоинт позволяет пользователю изменить свой пароль.
   * @summary Изменение пароля
   */
  const changePassword = (
    iUserChangePasswordDto: IUserChangePasswordDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/user/changePassword`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserChangePasswordDto,
      },
      options,
    );
  };

  /**
   * Удалить другого пользователя.
   * Этот эндпоинт позволяет администраторам удалить другого пользователя из системы.
   * @summary Удаление другого пользователя
   */
  const deleteUser = (
    id: string,
    options?: SecondParameter<typeof mainMutator<boolean>>,
  ) => {
    return mainMutator<boolean>(
      { url: `/api/user/delete/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Регистрация нового пользователя
   * @summary Регистрация
   */
  const signUp = (
    tSignUpRequestDto: TSignUpRequestDto,
    options?: SecondParameter<typeof mainMutator<IUserWithTokensDto>>,
  ) => {
    return mainMutator<IUserWithTokensDto>(
      {
        url: `/api/auth/sign-up`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: tSignUpRequestDto,
      },
      options,
    );
  };

  /**
   * Авторизация пользователя
   * @summary Вход в систему
   */
  const signIn = (
    iSignInRequestDto: ISignInRequestDto,
    options?: SecondParameter<typeof mainMutator<ISignInResponseDto>>,
  ) => {
    return mainMutator<ISignInResponseDto>(
      {
        url: `/api/auth/sign-in`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iSignInRequestDto,
      },
      options,
    );
  };

  /**
   * Запрос на сброс пароля
   * @summary Запрос сброса пароля
   */
  const requestResetPassword = (
    iUserLoginRequestDto: IUserLoginRequestDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/auth/request-reset-password`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserLoginRequestDto,
      },
      options,
    );
  };

  /**
   * Сброс пароля
   * @summary Смена пароля
   */
  const resetPassword = (
    iUserResetPasswordRequestDto: IUserResetPasswordRequestDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/auth/reset-password`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserResetPasswordRequestDto,
      },
      options,
    );
  };

  /**
   * Обновление токенов доступа
   * @summary Обновление токенов
   */
  const refresh = (
    refreshBody: RefreshBody,
    options?: SecondParameter<typeof mainMutator<ITokensDto>>,
  ) => {
    return mainMutator<ITokensDto>(
      {
        url: `/api/auth/refresh`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: refreshBody,
      },
      options,
    );
  };

  /**
   * Включить двухфакторную аутентификацию.
   * @summary Включение 2FA
   */
  const enable2FA = (
    iEnable2FARequestDto: IEnable2FARequestDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/auth/enable-2fa`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iEnable2FARequestDto,
      },
      options,
    );
  };

  /**
   * Отключить двухфакторную аутентификацию.
   * @summary Отключение 2FA
   */
  const disable2FA = (
    iDisable2FARequestDto: IDisable2FARequestDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/auth/disable-2fa`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iDisable2FARequestDto,
      },
      options,
    );
  };

  /**
   * Верифицировать 2FA и получить токены.
   * @summary Верификация 2FA
   */
  const verify2FA = (
    iVerify2FARequestDto: IVerify2FARequestDto,
    options?: SecondParameter<typeof mainMutator<IUserWithTokensDto>>,
  ) => {
    return mainMutator<IUserWithTokensDto>(
      {
        url: `/api/auth/verify-2fa`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerify2FARequestDto,
      },
      options,
    );
  };

  /**
   * Регистрирует биометрические ключи с устройства
   */
  const registerBiometric = (
    iRegisterBiometricRequestDto: IRegisterBiometricRequestDto,
    options?: SecondParameter<
      typeof mainMutator<IRegisterBiometricResponseDto>
    >,
  ) => {
    return mainMutator<IRegisterBiometricResponseDto>(
      {
        url: `/api/biometric/register`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iRegisterBiometricRequestDto,
      },
      options,
    );
  };

  /**
   * Генерирует nonce, который необходимо подписать на устройстве
   */
  const generateNonce = (
    iGenerateNonceRequestDto: IGenerateNonceRequestDto,
    options?: SecondParameter<typeof mainMutator<IGenerateNonceResponseDto>>,
  ) => {
    return mainMutator<IGenerateNonceResponseDto>(
      {
        url: `/api/biometric/generate-nonce`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iGenerateNonceRequestDto,
      },
      options,
    );
  };

  /**
   * Проверяет подпись и авторизует пользователя
   */
  const verifySignature = (
    iVerifyBiometricSignatureRequestDto: IVerifyBiometricSignatureRequestDto,
    options?: SecondParameter<
      typeof mainMutator<IVerifyBiometricSignatureResponseDto>
    >,
  ) => {
    return mainMutator<IVerifyBiometricSignatureResponseDto>(
      {
        url: `/api/biometric/verify-signature`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerifyBiometricSignatureRequestDto,
      },
      options,
    );
  };

  /**
   * Список зарегистрированных устройств пользователя
   */
  const getDevices = (
    options?: SecondParameter<typeof mainMutator<IBiometricDevicesResponseDto>>,
  ) => {
    return mainMutator<IBiometricDevicesResponseDto>(
      { url: `/api/biometric/devices`, method: "GET" },
      options,
    );
  };

  /**
   * Удалить зарегистрированное устройство
   */
  const deleteDevice = (
    deviceId: string,
    options?: SecondParameter<typeof mainMutator<IDeleteBiometricResponseDto>>,
  ) => {
    return mainMutator<IDeleteBiometricResponseDto>(
      { url: `/api/biometric/${deviceId}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Отправить сообщение от имени бота.
   * @summary Bot: отправка сообщения
   */
  const botSendMessage = (
    iBotSendMessageBody: IBotSendMessageBody,
    options?: SecondParameter<typeof mainMutator<MessageDto>>,
  ) => {
    return mainMutator<MessageDto>(
      {
        url: `/api/bot-api/message/send`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iBotSendMessageBody,
      },
      options,
    );
  };

  /**
   * Редактировать сообщение бота.
   * @summary Bot: редактирование сообщения
   */
  const botEditMessage = (
    id: string,
    iBotEditMessageBody: IBotEditMessageBody,
    options?: SecondParameter<typeof mainMutator<MessageDto>>,
  ) => {
    return mainMutator<MessageDto>(
      {
        url: `/api/bot-api/message/${id}/edit`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iBotEditMessageBody,
      },
      options,
    );
  };

  /**
   * Удалить сообщение бота.
   * @summary Bot: удаление сообщения
   */
  const botDeleteMessage = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/bot-api/message/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * @summary Создать бота
   */
  const createBot = (
    iCreateBotBody: ICreateBotBody,
    options?: SecondParameter<typeof mainMutator<BotDetailDto>>,
  ) => {
    return mainMutator<BotDetailDto>(
      {
        url: `/api/bot`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateBotBody,
      },
      options,
    );
  };

  /**
   * @summary Мои боты
   */
  const getMyBots = (
    options?: SecondParameter<typeof mainMutator<BotDto[]>>,
  ) => {
    return mainMutator<BotDto[]>({ url: `/api/bot`, method: "GET" }, options);
  };

  /**
   * @summary Детали бота
   */
  const getBotById = (
    id: string,
    options?: SecondParameter<typeof mainMutator<BotDetailDto>>,
  ) => {
    return mainMutator<BotDetailDto>(
      { url: `/api/bot/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * @summary Обновить бота
   */
  const updateBot = (
    id: string,
    iUpdateBotBody: IUpdateBotBody,
    options?: SecondParameter<typeof mainMutator<BotDetailDto>>,
  ) => {
    return mainMutator<BotDetailDto>(
      {
        url: `/api/bot/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateBotBody,
      },
      options,
    );
  };

  /**
   * @summary Удалить бота
   */
  const deleteBot = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/bot/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * @summary Перегенерировать токен
   */
  const regenerateToken = (
    id: string,
    options?: SecondParameter<typeof mainMutator<BotDetailDto>>,
  ) => {
    return mainMutator<BotDetailDto>(
      { url: `/api/bot/${id}/token`, method: "POST" },
      options,
    );
  };

  /**
   * @summary Установить webhook
   */
  const setWebhook = (
    id: string,
    iSetWebhookBody: ISetWebhookBody,
    options?: SecondParameter<typeof mainMutator<BotDetailDto>>,
  ) => {
    return mainMutator<BotDetailDto>(
      {
        url: `/api/bot/${id}/webhook`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iSetWebhookBody,
      },
      options,
    );
  };

  /**
   * @summary Удалить webhook
   */
  const deleteWebhook = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/bot/${id}/webhook`, method: "DELETE" },
      options,
    );
  };

  /**
   * @summary Установить команды бота
   */
  const setCommands = (
    id: string,
    iSetCommandsBody: ISetCommandsBody,
    options?: SecondParameter<typeof mainMutator<BotCommandDto[]>>,
  ) => {
    return mainMutator<BotCommandDto[]>(
      {
        url: `/api/bot/${id}/commands`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iSetCommandsBody,
      },
      options,
    );
  };

  /**
   * @summary Получить команды бота
   */
  const getCommands = (
    id: string,
    options?: SecondParameter<typeof mainMutator<BotCommandDto[]>>,
  ) => {
    return mainMutator<BotCommandDto[]>(
      { url: `/api/bot/${id}/commands`, method: "GET" },
      options,
    );
  };

  /**
   * @summary Тестировать webhook (отправляет ping)
   */
  const testWebhook = (
    id: string,
    options?: SecondParameter<typeof mainMutator<IWebhookTestResponse>>,
  ) => {
    return mainMutator<IWebhookTestResponse>(
      { url: `/api/bot/${id}/webhook/test`, method: "POST" },
      options,
    );
  };

  /**
   * @summary Получить логи доставки webhook
   */
  const getWebhookLogs = (
    id: string,
    params?: GetWebhookLogsParams,
    options?: SecondParameter<typeof mainMutator<IWebhookLogsResponse>>,
  ) => {
    return mainMutator<IWebhookLogsResponse>(
      { url: `/api/bot/${id}/webhook/logs`, method: "GET", params },
      options,
    );
  };

  /**
   * @summary Обновить фильтр событий webhook
   */
  const setWebhookEvents = (
    id: string,
    iSetWebhookEventsBody: ISetWebhookEventsBody,
    options?: SecondParameter<typeof mainMutator<BotDetailDto>>,
  ) => {
    return mainMutator<BotDetailDto>(
      {
        url: `/api/bot/${id}/webhook/events`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iSetWebhookEventsBody,
      },
      options,
    );
  };

  /**
   * Инициировать звонок.
   * @summary Начать звонок
   */
  const initiateCall = (
    iInitiateCallBody: IInitiateCallBody,
    options?: SecondParameter<typeof mainMutator<CallDto>>,
  ) => {
    return mainMutator<CallDto>(
      {
        url: `/api/call`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iInitiateCallBody,
      },
      options,
    );
  };

  /**
   * Ответить на звонок.
   * @summary Ответить
   */
  const answerCall = (
    id: string,
    options?: SecondParameter<typeof mainMutator<CallDto>>,
  ) => {
    return mainMutator<CallDto>(
      { url: `/api/call/${id}/answer`, method: "POST" },
      options,
    );
  };

  /**
   * Отклонить звонок.
   * @summary Отклонить
   */
  const declineCall = (
    id: string,
    options?: SecondParameter<typeof mainMutator<CallDto>>,
  ) => {
    return mainMutator<CallDto>(
      { url: `/api/call/${id}/decline`, method: "POST" },
      options,
    );
  };

  /**
   * Завершить звонок.
   * @summary Завершить
   */
  const endCall = (
    id: string,
    options?: SecondParameter<typeof mainMutator<CallDto>>,
  ) => {
    return mainMutator<CallDto>(
      { url: `/api/call/${id}/end`, method: "POST" },
      options,
    );
  };

  /**
   * Получить историю звонков.
   * @summary История звонков
   */
  const getCallHistory = (
    params?: GetCallHistoryParams,
    options?: SecondParameter<typeof mainMutator<ICallHistoryDto>>,
  ) => {
    return mainMutator<ICallHistoryDto>(
      { url: `/api/call/history`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить активный звонок.
   * @summary Активный звонок
   */
  const getActiveCall = (
    options?: SecondParameter<typeof mainMutator<CallDto | null>>,
  ) => {
    return mainMutator<CallDto | null>(
      { url: `/api/call/active`, method: "GET" },
      options,
    );
  };

  /**
   * Установить режим медленной отправки.
   * @summary Медленный режим
   */
  const setSlowMode = (
    id: string,
    iSetSlowModeBody: ISetSlowModeBody,
    options?: SecondParameter<typeof mainMutator<SetSlowMode200>>,
  ) => {
    return mainMutator<SetSlowMode200>(
      {
        url: `/api/chat/${id}/slow-mode`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iSetSlowModeBody,
      },
      options,
    );
  };

  /**
   * Заблокировать участника чата.
   * @summary Блокировка участника
   */
  const banMember = (
    id: string,
    userId: string,
    iBanMemberBody: IBanMemberBody,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/chat/${id}/members/${userId}/ban`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iBanMemberBody,
      },
      options,
    );
  };

  /**
   * Разблокировать участника чата.
   * @summary Разблокировка участника
   */
  const unbanMember = (
    id: string,
    userId: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/chat/${id}/members/${userId}/ban`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить заблокированных участников.
   * @summary Заблокированные участники
   */
  const getBannedMembers = (
    id: string,
    options?: SecondParameter<typeof mainMutator<IBannedMemberDto[]>>,
  ) => {
    return mainMutator<IBannedMemberDto[]>(
      { url: `/api/chat/${id}/members/banned`, method: "GET" },
      options,
    );
  };

  /**
   * Создать или получить существующий личный чат.
   * @summary Создание личного чата
   */
  const createDirectChat = (
    iCreateDirectChatBody: ICreateDirectChatBody,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      {
        url: `/api/chat/direct`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateDirectChatBody,
      },
      options,
    );
  };

  /**
   * Создать групповой чат.
   * @summary Создание группового чата
   */
  const createGroupChat = (
    iCreateGroupChatBody: ICreateGroupChatBody,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      {
        url: `/api/chat/group`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateGroupChatBody,
      },
      options,
    );
  };

  /**
   * Создать канал.
   * @summary Создание канала
   */
  const createChannel = (
    iCreateChannelBody: ICreateChannelBody,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      {
        url: `/api/chat/channel`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateChannelBody,
      },
      options,
    );
  };

  /**
   * Обновить канал.
   * @summary Обновление канала
   */
  const updateChannel = (
    id: string,
    iUpdateChannelBody: IUpdateChannelBody,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      {
        url: `/api/chat/channel/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateChannelBody,
      },
      options,
    );
  };

  /**
   * Подписаться на публичный канал.
   * @summary Подписка на канал
   */
  const subscribeToChannel = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      { url: `/api/chat/channel/${id}/subscribe`, method: "POST" },
      options,
    );
  };

  /**
   * Отписаться от канала.
   * @summary Отписка от канала
   */
  const unsubscribeFromChannel = (
    id: string,
    options?: SecondParameter<typeof mainMutator<string>>,
  ) => {
    return mainMutator<string>(
      { url: `/api/chat/channel/${id}/subscribe`, method: "DELETE" },
      options,
    );
  };

  /**
   * Поиск публичных каналов.
   * @summary Поиск каналов
   */
  const searchChannels = (
    params?: SearchChannelsParams,
    options?: SecondParameter<typeof mainMutator<IChatListDto>>,
  ) => {
    return mainMutator<IChatListDto>(
      { url: `/api/chat/channel/search`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить список чатов текущего пользователя.
   * @summary Список чатов
   */
  const getUserChats = (
    params?: GetUserChatsParams,
    options?: SecondParameter<typeof mainMutator<IChatListDto>>,
  ) => {
    return mainMutator<IChatListDto>(
      { url: `/api/chat`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить информацию о чате.
   * @summary Получение чата
   */
  const getChatById = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      { url: `/api/chat/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить групповой чат (название, аватар).
   * @summary Обновление чата
   */
  const updateChat = (
    id: string,
    iUpdateChatBody: IUpdateChatBody,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      {
        url: `/api/chat/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateChatBody,
      },
      options,
    );
  };

  /**
   * Покинуть чат.
   * @summary Выход из чата
   */
  const leaveChat = (
    id: string,
    options?: SecondParameter<typeof mainMutator<string>>,
  ) => {
    return mainMutator<string>(
      { url: `/api/chat/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Создать invite-ссылку для группового чата.
   * @summary Создание invite-ссылки
   */
  const createInviteLink = (
    id: string,
    iCreateInviteBody: ICreateInviteBody,
    options?: SecondParameter<typeof mainMutator<ChatInviteDto>>,
  ) => {
    return mainMutator<ChatInviteDto>(
      {
        url: `/api/chat/${id}/invite`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateInviteBody,
      },
      options,
    );
  };

  /**
   * Получить список invite-ссылок чата.
   * @summary Список invite-ссылок
   */
  const getInvites = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ChatInviteDto[]>>,
  ) => {
    return mainMutator<ChatInviteDto[]>(
      { url: `/api/chat/${id}/invite`, method: "GET" },
      options,
    );
  };

  /**
   * Отозвать invite-ссылку.
   * @summary Отзыв invite-ссылки
   */
  const revokeInvite = (
    id: string,
    inviteId: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/chat/${id}/invite/${inviteId}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Присоединиться к чату по invite-коду.
   * @summary Вступление по invite-ссылке
   */
  const joinByInvite = (
    code: string,
    options?: SecondParameter<typeof mainMutator<ChatDto>>,
  ) => {
    return mainMutator<ChatDto>(
      { url: `/api/chat/join/${code}`, method: "POST" },
      options,
    );
  };

  /**
   * Замутить или размутить чат.
   * @summary Мут чата
   */
  const muteChat = (
    id: string,
    iMuteChatBody: IMuteChatBody,
    options?: SecondParameter<typeof mainMutator<ChatMemberDto>>,
  ) => {
    return mainMutator<ChatMemberDto>(
      {
        url: `/api/chat/${id}/mute`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iMuteChatBody,
      },
      options,
    );
  };

  /**
   * Добавить участников в групповой чат.
   * @summary Добавление участников
   */
  const addMembers = (
    id: string,
    iAddMembersBody: IAddMembersBody,
    options?: SecondParameter<typeof mainMutator<ChatMemberDto[]>>,
  ) => {
    return mainMutator<ChatMemberDto[]>(
      {
        url: `/api/chat/${id}/members`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iAddMembersBody,
      },
      options,
    );
  };

  /**
   * Удалить участника из группового чата.
   * @summary Удаление участника
   */
  const removeMember = (
    id: string,
    userId: string,
    options?: SecondParameter<typeof mainMutator<string>>,
  ) => {
    return mainMutator<string>(
      { url: `/api/chat/${id}/members/${userId}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Изменить роль участника в групповом чате.
   * @summary Изменение роли участника
   */
  const updateMemberRole = (
    id: string,
    userId: string,
    iUpdateMemberRoleBody: IUpdateMemberRoleBody,
    options?: SecondParameter<typeof mainMutator<ChatMemberDto>>,
  ) => {
    return mainMutator<ChatMemberDto>(
      {
        url: `/api/chat/${id}/members/${userId}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateMemberRoleBody,
      },
      options,
    );
  };

  /**
   * Закрепить чат.
   * @summary Закрепление чата
   */
  const pinChat = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ChatMemberDto>>,
  ) => {
    return mainMutator<ChatMemberDto>(
      { url: `/api/chat/${id}/pin`, method: "POST" },
      options,
    );
  };

  /**
   * Открепить чат.
   * @summary Открепление чата
   */
  const unpinChat = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ChatMemberDto>>,
  ) => {
    return mainMutator<ChatMemberDto>(
      { url: `/api/chat/${id}/pin`, method: "DELETE" },
      options,
    );
  };

  /**
   * Переместить чат в папку.
   * @summary Перемещение в папку
   */
  const moveChatToFolder = (
    id: string,
    iMoveChatToFolderBody: IMoveChatToFolderBody,
    options?: SecondParameter<typeof mainMutator<ChatMemberDto>>,
  ) => {
    return mainMutator<ChatMemberDto>(
      {
        url: `/api/chat/${id}/folder`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iMoveChatToFolderBody,
      },
      options,
    );
  };

  /**
   * Получить список папок чатов.
   * @summary Список папок
   */
  const getUserFolders = (
    options?: SecondParameter<typeof mainMutator<ChatFolderDto[]>>,
  ) => {
    return mainMutator<ChatFolderDto[]>(
      { url: `/api/chat/folder/list`, method: "GET" },
      options,
    );
  };

  /**
   * Создать папку для чатов.
   * @summary Создание папки
   */
  const createFolder = (
    iCreateFolderBody: ICreateFolderBody,
    options?: SecondParameter<typeof mainMutator<ChatFolderDto>>,
  ) => {
    return mainMutator<ChatFolderDto>(
      {
        url: `/api/chat/folder`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateFolderBody,
      },
      options,
    );
  };

  /**
   * Обновить папку.
   * @summary Обновление папки
   */
  const updateFolder = (
    folderId: string,
    iUpdateFolderBody: IUpdateFolderBody,
    options?: SecondParameter<typeof mainMutator<ChatFolderDto>>,
  ) => {
    return mainMutator<ChatFolderDto>(
      {
        url: `/api/chat/folder/${folderId}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateFolderBody,
      },
      options,
    );
  };

  /**
   * Удалить папку.
   * @summary Удаление папки
   */
  const deleteFolder = (
    folderId: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/chat/folder/${folderId}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Добавить контакт.
   * @summary Добавление контакта
   */
  const addContact = (
    iCreateContactBody: ICreateContactBody,
    options?: SecondParameter<typeof mainMutator<ContactDto>>,
  ) => {
    return mainMutator<ContactDto>(
      {
        url: `/api/contact`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateContactBody,
      },
      options,
    );
  };

  /**
   * Получить список контактов текущего пользователя.
   * @summary Список контактов
   */
  const getContacts = (
    params?: GetContactsParams,
    options?: SecondParameter<typeof mainMutator<ContactDto[]>>,
  ) => {
    return mainMutator<ContactDto[]>(
      { url: `/api/contact`, method: "GET", params },
      options,
    );
  };

  /**
   * Принять запрос на добавление в контакты.
   * @summary Принять контакт
   */
  const acceptContact = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ContactDto>>,
  ) => {
    return mainMutator<ContactDto>(
      { url: `/api/contact/${id}/accept`, method: "PATCH" },
      options,
    );
  };

  /**
   * Удалить контакт.
   * @summary Удаление контакта
   */
  const removeContact = (
    id: string,
    options?: SecondParameter<typeof mainMutator<string>>,
  ) => {
    return mainMutator<string>(
      { url: `/api/contact/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Заблокировать контакт.
   * @summary Блокировка контакта
   */
  const blockContact = (
    id: string,
    options?: SecondParameter<typeof mainMutator<ContactDto>>,
  ) => {
    return mainMutator<ContactDto>(
      { url: `/api/contact/${id}/block`, method: "POST" },
      options,
    );
  };

  /**
   * Получить файл по ID.
   * Этот эндпоинт позволяет пользователю получить файл по его уникальному ID.
   * Он защищен с использованием JWT-аутентификации, что означает, что только аутентифицированные пользователи могут получить доступ к этому ресурсу.
   * @summary Получение файла по ID
   */
  const getFileById = (
    params: GetFileByIdParams,
    options?: SecondParameter<typeof mainMutator<IFileDto>>,
  ) => {
    return mainMutator<IFileDto>(
      { url: `/api/file`, method: "GET", params },
      options,
    );
  };

  /**
   * Загрузить файл.
   * Этот эндпоинт позволяет пользователю загрузить один файл на сервер.
   * Он защищен с использованием JWT-аутентификации, что означает, что только аутентифицированные пользователи могут загружать файлы.
   * @summary Загрузка файла
   */
  const uploadFile = (
    uploadFileBody: UploadFileBody,
    options?: SecondParameter<typeof mainMutator<IFileDto[]>>,
  ) => {
    const formData = new FormData();
    formData.append(`file`, uploadFileBody.file);

    return mainMutator<IFileDto[]>(
      {
        url: `/api/file`,
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        data: formData,
      },
      options,
    );
  };

  /**
   * Удалить файл.
   * Этот эндпоинт позволяет пользователю удалить файл по его ID. Доступ разрешен только пользователю, который загрузил файл, либо администратору.
   * @summary Удаление файла
   */
  const deleteFile = (
    id: string,
    options?: SecondParameter<typeof mainMutator<boolean>>,
  ) => {
    return mainMutator<boolean>(
      { url: `/api/file/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Отправить сообщение в чат.
   * @summary Отправка сообщения
   */
  const sendMessage = (
    chatId: string,
    iSendMessageBody: ISendMessageBody,
    options?: SecondParameter<typeof mainMutator<MessageDto>>,
  ) => {
    return mainMutator<MessageDto>(
      {
        url: `/api/chat/${chatId}/message`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iSendMessageBody,
      },
      options,
    );
  };

  /**
   * Получить сообщения чата с cursor-based пагинацией.
   * - `before` — загрузить старые сообщения (скролл вверх)
   * - `after` — загрузить новые сообщения (скролл вниз из detached окна)
   * - `around` — загрузить окно вокруг конкретного сообщения (навигация)
   * - без параметров — последние сообщения
   * @summary Список сообщений
   */
  const getMessages = (
    chatId: string,
    params?: GetMessagesParams,
    options?: SecondParameter<typeof mainMutator<IMessageListDto>>,
  ) => {
    return mainMutator<IMessageListDto>(
      { url: `/api/chat/${chatId}/message`, method: "GET", params },
      options,
    );
  };

  /**
   * Поиск сообщений в чате.
   * @summary Поиск в чате
   */
  const searchChatMessages = (
    chatId: string,
    params: SearchChatMessagesParams,
    options?: SecondParameter<typeof mainMutator<IMessageSearchDto>>,
  ) => {
    return mainMutator<IMessageSearchDto>(
      { url: `/api/chat/${chatId}/message/search`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить закреплённые сообщения чата.
   * @summary Закреплённые сообщения
   */
  const getPinnedMessages = (
    chatId: string,
    options?: SecondParameter<typeof mainMutator<MessageDto[]>>,
  ) => {
    return mainMutator<MessageDto[]>(
      { url: `/api/chat/${chatId}/message/pinned`, method: "GET" },
      options,
    );
  };

  /**
   * Получить медиафайлы чата.
   * @summary Медиа-галерея чата
   */
  const getChatMedia = (
    chatId: string,
    params?: GetChatMediaParams,
    options?: SecondParameter<typeof mainMutator<IMediaGalleryDto>>,
  ) => {
    return mainMutator<IMediaGalleryDto>(
      { url: `/api/chat/${chatId}/media`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить статистику медиафайлов чата.
   * @summary Статистика медиа
   */
  const getChatMediaStats = (
    chatId: string,
    options?: SecondParameter<typeof mainMutator<IMediaStatsDto>>,
  ) => {
    return mainMutator<IMediaStatsDto>(
      { url: `/api/chat/${chatId}/media/stats`, method: "GET" },
      options,
    );
  };

  /**
   * Отметить сообщения как прочитанные.
   * @summary Прочитать сообщения
   */
  const markAsRead = (
    chatId: string,
    iMarkReadBody: IMarkReadBody,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/chat/${chatId}/message/read`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iMarkReadBody,
      },
      options,
    );
  };

  /**
   * Глобальный поиск по сообщениям во всех чатах пользователя.
   * @summary Глобальный поиск сообщений
   */
  const searchMessages = (
    params: SearchMessagesParams,
    options?: SecondParameter<typeof mainMutator<IMessageSearchDto>>,
  ) => {
    return mainMutator<IMessageSearchDto>(
      { url: `/api/message/search`, method: "GET", params },
      options,
    );
  };

  /**
   * Отредактировать сообщение.
   * @summary Редактирование сообщения
   */
  const editMessage = (
    id: string,
    iEditMessageBody: IEditMessageBody,
    options?: SecondParameter<typeof mainMutator<MessageDto>>,
  ) => {
    return mainMutator<MessageDto>(
      {
        url: `/api/message/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iEditMessageBody,
      },
      options,
    );
  };

  /**
   * Удалить сообщение. forAll=true — для всех, forAll=false — только для себя.
   * @summary Удаление сообщения
   */
  const deleteMessage = (
    id: string,
    params?: DeleteMessageParams,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/message/${id}`, method: "DELETE", params },
      options,
    );
  };

  /**
   * Добавить реакцию на сообщение.
   * @summary Добавление реакции
   */
  const addReaction = (
    id: string,
    iAddReactionBody: IAddReactionBody,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/message/${id}/reaction`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iAddReactionBody,
      },
      options,
    );
  };

  /**
   * Удалить реакцию с сообщения.
   * @summary Удаление реакции
   */
  const removeReaction = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/message/${id}/reaction`, method: "DELETE" },
      options,
    );
  };

  /**
   * Закрепить сообщение.
   * @summary Закрепление сообщения
   */
  const pinMessage = (
    id: string,
    options?: SecondParameter<typeof mainMutator<MessageDto>>,
  ) => {
    return mainMutator<MessageDto>(
      { url: `/api/message/${id}/pin`, method: "POST" },
      options,
    );
  };

  /**
   * Открепить сообщение.
   * @summary Открепление сообщения
   */
  const unpinMessage = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/message/${id}/pin`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить информацию о прочтении сообщения (кто прочитал, кто получил).
   * Доступно для участников чата.
   * @summary Информация о прочтении сообщения
   */
  const getReceiptInfo = (
    id: string,
    options?: SecondParameter<typeof mainMutator<MessageReceiptDto[]>>,
  ) => {
    return mainMutator<MessageReceiptDto[]>(
      { url: `/api/message/${id}/receipts`, method: "GET" },
      options,
    );
  };

  /**
   * Генерирует параметры для регистрации нового passkey.
   * Требует авторизации — passkey привязывается к текущему пользователю.
   * @summary Параметры регистрации passkey
   */
  const generateRegistrationOptions = (
    options?: SecondParameter<
      typeof mainMutator<PublicKeyCredentialCreationOptionsJSON>
    >,
  ) => {
    return mainMutator<PublicKeyCredentialCreationOptionsJSON>(
      { url: `/api/passkeys/generate-registration-options`, method: "POST" },
      options,
    );
  };

  /**
   * Верифицирует ответ устройства и сохраняет passkey для текущего пользователя.
   * @summary Верификация регистрации passkey
   */
  const verifyRegistration = (
    iVerifyRegistrationRequestDto: IVerifyRegistrationRequestDto,
    options?: SecondParameter<
      typeof mainMutator<IVerifyRegistrationResponseDto>
    >,
  ) => {
    return mainMutator<IVerifyRegistrationResponseDto>(
      {
        url: `/api/passkeys/verify-registration`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerifyRegistrationRequestDto,
      },
      options,
    );
  };

  /**
   * Генерирует параметры для аутентификации по passkey.
   * Принимает login (email или телефон) пользователя.
   * @summary Параметры аутентификации passkey
   */
  const generateAuthenticationOptions = (
    iGenerateAuthenticationOptionsRequestDto: IGenerateAuthenticationOptionsRequestDto,
    options?: SecondParameter<
      typeof mainMutator<PublicKeyCredentialRequestOptionsJSON>
    >,
  ) => {
    return mainMutator<PublicKeyCredentialRequestOptionsJSON>(
      {
        url: `/api/passkeys/generate-authentication-options`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iGenerateAuthenticationOptionsRequestDto,
      },
      options,
    );
  };

  /**
   * Верифицирует ответ устройства и возвращает токены при успехе.
   * @summary Аутентификация по passkey
   */
  const verifyAuthentication = (
    iVerifyAuthenticationRequestDto: IVerifyAuthenticationRequestDto,
    options?: SecondParameter<
      typeof mainMutator<IVerifyAuthenticationResponseDto>
    >,
  ) => {
    return mainMutator<IVerifyAuthenticationResponseDto>(
      {
        url: `/api/passkeys/verify-authentication`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerifyAuthenticationRequestDto,
      },
      options,
    );
  };

  /**
   * Создать опрос в чате.
   * @summary Создание опроса
   */
  const createPoll = (
    chatId: string,
    iCreatePollBody: ICreatePollBody,
    options?: SecondParameter<typeof mainMutator<PollDto>>,
  ) => {
    return mainMutator<PollDto>(
      {
        url: `/api/chat/${chatId}/poll`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreatePollBody,
      },
      options,
    );
  };

  /**
   * Проголосовать в опросе.
   * @summary Голосование
   */
  const vote = (
    id: string,
    iVotePollBody: IVotePollBody,
    options?: SecondParameter<typeof mainMutator<PollDto>>,
  ) => {
    return mainMutator<PollDto>(
      {
        url: `/api/poll/${id}/vote`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVotePollBody,
      },
      options,
    );
  };

  /**
   * Отозвать голос.
   * @summary Отзыв голоса
   */
  const retractVote = (
    id: string,
    options?: SecondParameter<typeof mainMutator<PollDto>>,
  ) => {
    return mainMutator<PollDto>(
      { url: `/api/poll/${id}/vote`, method: "DELETE" },
      options,
    );
  };

  /**
   * Закрыть опрос.
   * @summary Закрытие опроса
   */
  const closePoll = (
    id: string,
    options?: SecondParameter<typeof mainMutator<PollDto>>,
  ) => {
    return mainMutator<PollDto>(
      { url: `/api/poll/${id}/close`, method: "POST" },
      options,
    );
  };

  /**
   * Получить опрос по ID.
   * @summary Получение опроса
   */
  const getPoll = (
    id: string,
    options?: SecondParameter<typeof mainMutator<PollDto>>,
  ) => {
    return mainMutator<PollDto>(
      { url: `/api/poll/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Зарегистрировать устройство для push-уведомлений.
   * @summary Регистрация устройства
   */
  const registerDevice = (
    iRegisterDeviceBody: IRegisterDeviceBody,
    options?: SecondParameter<typeof mainMutator<DeviceTokenDto>>,
  ) => {
    return mainMutator<DeviceTokenDto>(
      {
        url: `/api/device`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iRegisterDeviceBody,
      },
      options,
    );
  };

  /**
   * Удалить устройство из push-уведомлений.
   * @summary Удаление устройства
   */
  const unregisterDevice = (
    token: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/device/${token}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить настройки уведомлений текущего пользователя.
   * @summary Настройки уведомлений
   */
  const getSettings = (
    options?: SecondParameter<typeof mainMutator<NotificationSettingsDto>>,
  ) => {
    return mainMutator<NotificationSettingsDto>(
      { url: `/api/notification/settings`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить настройки уведомлений.
   * @summary Обновление настроек уведомлений
   */
  const updateSettings = (
    iUpdateNotificationSettingsBody: IUpdateNotificationSettingsBody,
    options?: SecondParameter<typeof mainMutator<NotificationSettingsDto>>,
  ) => {
    return mainMutator<NotificationSettingsDto>(
      {
        url: `/api/notification/settings`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateNotificationSettingsBody,
      },
      options,
    );
  };

  /**
   * Получить изменения с указанной версии (компактифицированные).
   * Если версия клиента устарела — вернёт requiresSnapshot: true.
   * @summary Incremental sync
   */
  const getChanges = (
    params?: GetChangesParams,
    options?: SecondParameter<typeof mainMutator<ISyncResponseDto>>,
  ) => {
    return mainMutator<ISyncResponseDto>(
      { url: `/api/sync`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить текущую sync version.
   * Используется при первом запуске для установки начальной точки синхронизации.
   * @summary Current sync version
   */
  const getVersion = (
    options?: SecondParameter<typeof mainMutator<ISyncVersionDto>>,
  ) => {
    return mainMutator<ISyncVersionDto>(
      { url: `/api/sync/version`, method: "GET" },
      options,
    );
  };

  return {
    getSessions,
    terminateSession,
    terminateOtherSessions,
    getMyProfile,
    updateMyProfile,
    getPrivacySettings,
    updatePrivacySettings,
    deleteMyProfile,
    getProfiles,
    getProfileById,
    updateProfile,
    deleteProfile,
    getRoles,
    createRole,
    deleteRole,
    setRolePermissions,
    getMyUser,
    updateMyUser,
    deleteMyUser,
    setUsername,
    searchUsers,
    getUserByUsername,
    getUsers,
    getUserOptions,
    getUserById,
    setPrivileges,
    requestVerifyEmail,
    verifyEmail,
    updateUser,
    changePassword,
    deleteUser,
    signUp,
    signIn,
    requestResetPassword,
    resetPassword,
    refresh,
    enable2FA,
    disable2FA,
    verify2FA,
    registerBiometric,
    generateNonce,
    verifySignature,
    getDevices,
    deleteDevice,
    botSendMessage,
    botEditMessage,
    botDeleteMessage,
    createBot,
    getMyBots,
    getBotById,
    updateBot,
    deleteBot,
    regenerateToken,
    setWebhook,
    deleteWebhook,
    setCommands,
    getCommands,
    testWebhook,
    getWebhookLogs,
    setWebhookEvents,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    getCallHistory,
    getActiveCall,
    setSlowMode,
    banMember,
    unbanMember,
    getBannedMembers,
    createDirectChat,
    createGroupChat,
    createChannel,
    updateChannel,
    subscribeToChannel,
    unsubscribeFromChannel,
    searchChannels,
    getUserChats,
    getChatById,
    updateChat,
    leaveChat,
    createInviteLink,
    getInvites,
    revokeInvite,
    joinByInvite,
    muteChat,
    addMembers,
    removeMember,
    updateMemberRole,
    pinChat,
    unpinChat,
    moveChatToFolder,
    getUserFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    addContact,
    getContacts,
    acceptContact,
    removeContact,
    blockContact,
    getFileById,
    uploadFile,
    deleteFile,
    sendMessage,
    getMessages,
    searchChatMessages,
    getPinnedMessages,
    getChatMedia,
    getChatMediaStats,
    markAsRead,
    searchMessages,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    pinMessage,
    unpinMessage,
    getReceiptInfo,
    generateRegistrationOptions,
    verifyRegistration,
    generateAuthenticationOptions,
    verifyAuthentication,
    createPoll,
    vote,
    retractVote,
    closePoll,
    getPoll,
    registerDevice,
    unregisterDevice,
    getSettings,
    updateSettings,
    getChanges,
    getVersion,
  };
};
export type GetSessionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getSessions"]>>
>;
export type TerminateSessionResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["terminateSession"]>>
>;
export type TerminateOtherSessionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["terminateOtherSessions"]>>
>;
export type GetMyProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getMyProfile"]>>
>;
export type UpdateMyProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateMyProfile"]>>
>;
export type GetPrivacySettingsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getPrivacySettings"]>>
>;
export type UpdatePrivacySettingsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updatePrivacySettings"]>>
>;
export type DeleteMyProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteMyProfile"]>>
>;
export type GetProfilesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getProfiles"]>>
>;
export type GetProfileByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getProfileById"]>>
>;
export type UpdateProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateProfile"]>>
>;
export type DeleteProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteProfile"]>>
>;
export type GetRolesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getRoles"]>>
>;
export type CreateRoleResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createRole"]>>
>;
export type DeleteRoleResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteRole"]>>
>;
export type SetRolePermissionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setRolePermissions"]>>
>;
export type GetMyUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getMyUser"]>>
>;
export type UpdateMyUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateMyUser"]>>
>;
export type DeleteMyUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteMyUser"]>>
>;
export type SetUsernameResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setUsername"]>>
>;
export type SearchUsersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["searchUsers"]>>
>;
export type GetUserByUsernameResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getUserByUsername"]>>
>;
export type GetUsersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getUsers"]>>
>;
export type GetUserOptionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getUserOptions"]>>
>;
export type GetUserByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getUserById"]>>
>;
export type SetPrivilegesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setPrivileges"]>>
>;
export type RequestVerifyEmailResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["requestVerifyEmail"]>>
>;
export type VerifyEmailResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["verifyEmail"]>>
>;
export type UpdateUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateUser"]>>
>;
export type ChangePasswordResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["changePassword"]>>
>;
export type DeleteUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteUser"]>>
>;
export type SignUpResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["signUp"]>>
>;
export type SignInResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["signIn"]>>
>;
export type RequestResetPasswordResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["requestResetPassword"]>>
>;
export type ResetPasswordResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["resetPassword"]>>
>;
export type RefreshResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["refresh"]>>
>;
export type Enable2FAResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["enable2FA"]>>
>;
export type Disable2FAResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["disable2FA"]>>
>;
export type Verify2FAResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["verify2FA"]>>
>;
export type RegisterBiometricResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["registerBiometric"]>>
>;
export type GenerateNonceResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["generateNonce"]>>
>;
export type VerifySignatureResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["verifySignature"]>>
>;
export type GetDevicesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getDevices"]>>
>;
export type DeleteDeviceResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteDevice"]>>
>;
export type BotSendMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["botSendMessage"]>>
>;
export type BotEditMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["botEditMessage"]>>
>;
export type BotDeleteMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["botDeleteMessage"]>>
>;
export type CreateBotResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createBot"]>>
>;
export type GetMyBotsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getMyBots"]>>
>;
export type GetBotByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getBotById"]>>
>;
export type UpdateBotResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateBot"]>>
>;
export type DeleteBotResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteBot"]>>
>;
export type RegenerateTokenResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["regenerateToken"]>>
>;
export type SetWebhookResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setWebhook"]>>
>;
export type DeleteWebhookResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteWebhook"]>>
>;
export type SetCommandsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setCommands"]>>
>;
export type GetCommandsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getCommands"]>>
>;
export type TestWebhookResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["testWebhook"]>>
>;
export type GetWebhookLogsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getWebhookLogs"]>>
>;
export type SetWebhookEventsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setWebhookEvents"]>>
>;
export type InitiateCallResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["initiateCall"]>>
>;
export type AnswerCallResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["answerCall"]>>
>;
export type DeclineCallResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["declineCall"]>>
>;
export type EndCallResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["endCall"]>>
>;
export type GetCallHistoryResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getCallHistory"]>>
>;
export type GetActiveCallResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getActiveCall"]>>
>;
export type SetSlowModeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setSlowMode"]>>
>;
export type BanMemberResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["banMember"]>>
>;
export type UnbanMemberResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["unbanMember"]>>
>;
export type GetBannedMembersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getBannedMembers"]>>
>;
export type CreateDirectChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createDirectChat"]>>
>;
export type CreateGroupChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createGroupChat"]>>
>;
export type CreateChannelResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createChannel"]>>
>;
export type UpdateChannelResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateChannel"]>>
>;
export type SubscribeToChannelResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["subscribeToChannel"]>>
>;
export type UnsubscribeFromChannelResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["unsubscribeFromChannel"]>>
>;
export type SearchChannelsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["searchChannels"]>>
>;
export type GetUserChatsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getUserChats"]>>
>;
export type GetChatByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getChatById"]>>
>;
export type UpdateChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateChat"]>>
>;
export type LeaveChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["leaveChat"]>>
>;
export type CreateInviteLinkResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createInviteLink"]>>
>;
export type GetInvitesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getInvites"]>>
>;
export type RevokeInviteResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["revokeInvite"]>>
>;
export type JoinByInviteResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["joinByInvite"]>>
>;
export type MuteChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["muteChat"]>>
>;
export type AddMembersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["addMembers"]>>
>;
export type RemoveMemberResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["removeMember"]>>
>;
export type UpdateMemberRoleResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateMemberRole"]>>
>;
export type PinChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["pinChat"]>>
>;
export type UnpinChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["unpinChat"]>>
>;
export type MoveChatToFolderResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["moveChatToFolder"]>>
>;
export type GetUserFoldersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getUserFolders"]>>
>;
export type CreateFolderResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createFolder"]>>
>;
export type UpdateFolderResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateFolder"]>>
>;
export type DeleteFolderResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteFolder"]>>
>;
export type AddContactResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["addContact"]>>
>;
export type GetContactsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getContacts"]>>
>;
export type AcceptContactResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["acceptContact"]>>
>;
export type RemoveContactResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["removeContact"]>>
>;
export type BlockContactResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["blockContact"]>>
>;
export type GetFileByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getFileById"]>>
>;
export type UploadFileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["uploadFile"]>>
>;
export type DeleteFileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteFile"]>>
>;
export type SendMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["sendMessage"]>>
>;
export type GetMessagesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getMessages"]>>
>;
export type SearchChatMessagesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["searchChatMessages"]>>
>;
export type GetPinnedMessagesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getPinnedMessages"]>>
>;
export type GetChatMediaResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getChatMedia"]>>
>;
export type GetChatMediaStatsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getChatMediaStats"]>>
>;
export type MarkAsReadResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["markAsRead"]>>
>;
export type SearchMessagesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["searchMessages"]>>
>;
export type EditMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["editMessage"]>>
>;
export type DeleteMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteMessage"]>>
>;
export type AddReactionResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["addReaction"]>>
>;
export type RemoveReactionResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["removeReaction"]>>
>;
export type PinMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["pinMessage"]>>
>;
export type UnpinMessageResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["unpinMessage"]>>
>;
export type GetReceiptInfoResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getReceiptInfo"]>>
>;
export type GenerateRegistrationOptionsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getRestApi>["generateRegistrationOptions"]>
  >
>;
export type VerifyRegistrationResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["verifyRegistration"]>>
>;
export type GenerateAuthenticationOptionsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getRestApi>["generateAuthenticationOptions"]>
  >
>;
export type VerifyAuthenticationResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["verifyAuthentication"]>>
>;
export type CreatePollResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createPoll"]>>
>;
export type VoteResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["vote"]>>
>;
export type RetractVoteResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["retractVote"]>>
>;
export type ClosePollResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["closePoll"]>>
>;
export type GetPollResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getPoll"]>>
>;
export type RegisterDeviceResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["registerDevice"]>>
>;
export type UnregisterDeviceResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["unregisterDevice"]>>
>;
export type GetSettingsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getSettings"]>>
>;
export type UpdateSettingsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateSettings"]>>
>;
export type GetChangesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getChanges"]>>
>;
export type GetVersionResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getVersion"]>>
>;
