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

import { axiosInstance } from "../http-client";
export const getRestApi = () => {
  /**
   * Получить список активных сессий пользователя.
   * @summary Список сессий
   */
  const getSessions = () => {
    return axiosInstance<SessionDto[]>({ url: `/api/session`, method: "GET" });
  };

  /**
   * Завершить конкретную сессию.
   * @summary Завершение сессии
   */
  const terminateSession = (id: string) => {
    return axiosInstance<void>({ url: `/api/session/${id}`, method: "DELETE" });
  };

  /**
   * Завершить все сессии, кроме текущей.
   * @summary Завершение остальных сессий
   */
  const terminateOtherSessions = () => {
    return axiosInstance<void>({
      url: `/api/session/terminate-others`,
      method: "POST",
    });
  };

  /**
   * Получить профиль текущего пользователя.
   * Этот эндпоинт позволяет получить данные профиля пользователя, который выполнил запрос.
   * Используется для получения информации о текущем пользователе, например, его имени, email, и других данных.
   * @summary Получение профиля текущего пользователя
   */
  const getMyProfile = () => {
    return axiosInstance<ProfileDto>({ url: `/api/profile/my`, method: "GET" });
  };

  /**
   * Обновить профиль текущего пользователя.
   * Этот эндпоинт позволяет пользователю обновить свои данные, такие как имя, email и другие параметры профиля.
   * @summary Обновление профиля текущего пользователя
   */
  const updateMyProfile = (
    iProfileUpdateRequestDto: IProfileUpdateRequestDto,
  ) => {
    return axiosInstance<ProfileDto>({
      url: `/api/profile/my/update`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iProfileUpdateRequestDto,
    });
  };

  /**
   * Получить настройки приватности.
   * @summary Настройки приватности
   */
  const getPrivacySettings = () => {
    return axiosInstance<PrivacySettingsDto>({
      url: `/api/profile/my/privacy`,
      method: "GET",
    });
  };

  /**
   * Обновить настройки приватности.
   * @summary Обновление настроек приватности
   */
  const updatePrivacySettings = (
    updatePrivacySettingsBody: UpdatePrivacySettingsBody,
  ) => {
    return axiosInstance<PrivacySettingsDto>({
      url: `/api/profile/my/privacy`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updatePrivacySettingsBody,
    });
  };

  /**
   * Удалить профиль текущего пользователя.
   * Этот эндпоинт позволяет пользователю удалить свой профиль из системы.
   * @summary Удаление профиля текущего пользователя
   */
  const deleteMyProfile = () => {
    return axiosInstance<string>({
      url: `/api/profile/my/delete`,
      method: "DELETE",
    });
  };

  /**
   * Получить все профили.
   * Этот эндпоинт позволяет администраторам получить список всех пользователей системы.
   * Он поддерживает пагинацию через параметры `offset` и `limit`.
   * @summary Получение всех профилей
   */
  const getProfiles = (params?: GetProfilesParams) => {
    return axiosInstance<IProfileListDto>({
      url: `/api/profile/all`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить профиль по ID.
   * Этот эндпоинт позволяет получить профиль другого пользователя по его ID. Доступен только для администраторов.
   * @summary Получение профиля по ID
   */
  const getProfileById = (userId: string) => {
    return axiosInstance<PublicProfileDto>({
      url: `/api/profile/${userId}`,
      method: "GET",
    });
  };

  /**
   * Обновить профиль другого пользователя.
   * Этот эндпоинт позволяет администраторам обновлять профиль других пользователей.
   * @summary Обновление профиля другого пользователя
   */
  const updateProfile = (
    userId: string,
    iProfileUpdateRequestDto: IProfileUpdateRequestDto,
  ) => {
    return axiosInstance<ProfileDto>({
      url: `/api/profile/update/${userId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iProfileUpdateRequestDto,
    });
  };

  /**
   * Удалить профиль другого пользователя.
   * Этот эндпоинт позволяет администраторам удалить профиль другого пользователя из системы.
   * @summary Удаление профиля другого пользователя
   */
  const deleteProfile = (userId: string) => {
    return axiosInstance<string>({
      url: `/api/profile/delete/${userId}`,
      method: "DELETE",
    });
  };

  /**
   * Получить все роли с их правами.
   * @summary Список ролей
   */
  const getRoles = () => {
    return axiosInstance<IRoleDto[]>({ url: `/api/roles`, method: "GET" });
  };

  /**
   * Создать новую роль.
   * @summary Создание роли
   */
  const createRole = (iCreateRoleRequestDto: ICreateRoleRequestDto) => {
    return axiosInstance<IRoleDto>({
      url: `/api/roles`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateRoleRequestDto,
    });
  };

  /**
   * Удалить роль.
   * @summary Удаление роли
   */
  const deleteRole = (id: string) => {
    return axiosInstance<void>({ url: `/api/roles/${id}`, method: "DELETE" });
  };

  /**
   * Установить права для роли.
   * Заменяет текущий набор прав роли указанным.
   * @summary Установка прав роли
   */
  const setRolePermissions = (
    id: string,
    iRolePermissionsRequestDto: IRolePermissionsRequestDto,
  ) => {
    return axiosInstance<IRoleDto>({
      url: `/api/roles/${id}/permissions`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iRolePermissionsRequestDto,
    });
  };

  /**
   * Получить пользователя.
   * Этот эндпоинт позволяет получить данные пользователя, который выполнил запрос.
   * @summary Получение данных текущего пользователя
   */
  const getMyUser = () => {
    return axiosInstance<UserDto>({ url: `/api/user/my`, method: "GET" });
  };

  /**
   * Обновить пользователя.
   * Этот эндпоинт позволяет пользователю обновить свои данные, такие как email, телефон и другие параметры пользователя.
   * @summary Обновление данных текущего пользователя
   */
  const updateMyUser = (iUserUpdateRequestDto: IUserUpdateRequestDto) => {
    return axiosInstance<UserDto>({
      url: `/api/user/my/update`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUserUpdateRequestDto,
    });
  };

  /**
   * Удалить текущего пользователя.
   * Этот эндпоинт позволяет удалить пользователя из системы.
   * @summary Удаление текущего пользователя
   */
  const deleteMyUser = () => {
    return axiosInstance<boolean>({
      url: `/api/user/my/delete`,
      method: "DELETE",
    });
  };

  /**
   * Установить username для текущего пользователя.
   * @summary Установка username
   */
  const setUsername = (setUsernameBody: SetUsernameBody) => {
    return axiosInstance<UserDto>({
      url: `/api/user/my/username`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: setUsernameBody,
    });
  };

  /**
   * Поиск пользователей по запросу (username, email, имя, фамилия).
   * @summary Поиск пользователей
   */
  const searchUsers = (params: SearchUsersParams) => {
    return axiosInstance<IUserListDto>({
      url: `/api/user/search`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить пользователя по username.
   * @summary Получение по username
   */
  const getUserByUsername = (username: string) => {
    return axiosInstance<PublicUserDto>({
      url: `/api/user/by-username/${username}`,
      method: "GET",
    });
  };

  /**
   * Получить всех пользователей.
   * Поддерживает пагинацию и поиск по email.
   * @summary Получение всех пользователей
   */
  const getUsers = (params?: GetUsersParams) => {
    return axiosInstance<IUserListDto>({
      url: `/api/user/all`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить опции пользователей для выпадающих списков (id + name).
   * name — имя и фамилия или email если профиль не заполнен.
   * @summary Опции пользователей
   */
  const getUserOptions = (params?: GetUserOptionsParams) => {
    return axiosInstance<IUserOptionsDto>({
      url: `/api/user/options`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить пользователя по ID.
   * Этот эндпоинт позволяет получить пользователя по его ID. Доступен только для администраторов.
   * @summary Получение пользователя по ID
   */
  const getUserById = (id: string) => {
    return axiosInstance<UserDto>({ url: `/api/user/${id}`, method: "GET" });
  };

  /**
   * Установить привилегии для пользователя.
   * Этот эндпоинт позволяет администраторам устанавливать роль и права пользователя.
   * @summary Установка привилегий для пользователя
   */
  const setPrivileges = (
    id: string,
    iUserPrivilegesRequestDto: IUserPrivilegesRequestDto,
  ) => {
    return axiosInstance<UserDto>({
      url: `/api/user/setPrivileges/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUserPrivilegesRequestDto,
    });
  };

  /**
   * Запросить подтверждение email-адреса для текущего пользователя.
   * Этот эндпоинт позволяет отправить пользователю письмо для подтверждения его email-адреса.
   * @summary Запрос подтверждения email
   */
  const requestVerifyEmail = () => {
    return axiosInstance<boolean>({
      url: `/api/user/requestVerifyEmail`,
      method: "POST",
    });
  };

  /**
   * Подтвердить email-адрес текущего пользователя по коду.
   * Этот эндпоинт позволяет пользователю подтвердить свой email, используя код, полученный в письме.
   * @summary Подтверждение email-адреса
   */
  const verifyEmail = (code: string) => {
    return axiosInstance<ApiResponseDto>({
      url: `/api/user/verifyEmail/${code}`,
      method: "GET",
    });
  };

  /**
   * Обновить пользователя.
   * Этот эндпоинт позволяет администраторам обновлять других пользователей.
   * @summary Обновление другого пользователя
   */
  const updateUser = (
    id: string,
    iUserUpdateRequestDto: IUserUpdateRequestDto,
  ) => {
    return axiosInstance<UserDto>({
      url: `/api/user/update/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUserUpdateRequestDto,
    });
  };

  /**
   * Изменить пароль текущего пользователя.
   * Этот эндпоинт позволяет пользователю изменить свой пароль.
   * @summary Изменение пароля
   */
  const changePassword = (iUserChangePasswordDto: IUserChangePasswordDto) => {
    return axiosInstance<ApiResponseDto>({
      url: `/api/user/changePassword`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iUserChangePasswordDto,
    });
  };

  /**
   * Удалить другого пользователя.
   * Этот эндпоинт позволяет администраторам удалить другого пользователя из системы.
   * @summary Удаление другого пользователя
   */
  const deleteUser = (id: string) => {
    return axiosInstance<boolean>({
      url: `/api/user/delete/${id}`,
      method: "DELETE",
    });
  };

  /**
   * Регистрация нового пользователя
   * @summary Регистрация
   */
  const signUp = (tSignUpRequestDto: TSignUpRequestDto) => {
    return axiosInstance<IUserWithTokensDto>({
      url: `/api/auth/sign-up`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: tSignUpRequestDto,
    });
  };

  /**
   * Авторизация пользователя
   * @summary Вход в систему
   */
  const signIn = (iSignInRequestDto: ISignInRequestDto) => {
    return axiosInstance<ISignInResponseDto>({
      url: `/api/auth/sign-in`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iSignInRequestDto,
    });
  };

  /**
   * Запрос на сброс пароля
   * @summary Запрос сброса пароля
   */
  const requestResetPassword = (iUserLoginRequestDto: IUserLoginRequestDto) => {
    return axiosInstance<ApiResponseDto>({
      url: `/api/auth/request-reset-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iUserLoginRequestDto,
    });
  };

  /**
   * Сброс пароля
   * @summary Смена пароля
   */
  const resetPassword = (
    iUserResetPasswordRequestDto: IUserResetPasswordRequestDto,
  ) => {
    return axiosInstance<ApiResponseDto>({
      url: `/api/auth/reset-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iUserResetPasswordRequestDto,
    });
  };

  /**
   * Обновление токенов доступа
   * @summary Обновление токенов
   */
  const refresh = (refreshBody: RefreshBody) => {
    return axiosInstance<ITokensDto>({
      url: `/api/auth/refresh`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: refreshBody,
    });
  };

  /**
   * Включить двухфакторную аутентификацию.
   * @summary Включение 2FA
   */
  const enable2FA = (iEnable2FARequestDto: IEnable2FARequestDto) => {
    return axiosInstance<ApiResponseDto>({
      url: `/api/auth/enable-2fa`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iEnable2FARequestDto,
    });
  };

  /**
   * Отключить двухфакторную аутентификацию.
   * @summary Отключение 2FA
   */
  const disable2FA = (iDisable2FARequestDto: IDisable2FARequestDto) => {
    return axiosInstance<ApiResponseDto>({
      url: `/api/auth/disable-2fa`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iDisable2FARequestDto,
    });
  };

  /**
   * Верифицировать 2FA и получить токены.
   * @summary Верификация 2FA
   */
  const verify2FA = (iVerify2FARequestDto: IVerify2FARequestDto) => {
    return axiosInstance<IUserWithTokensDto>({
      url: `/api/auth/verify-2fa`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iVerify2FARequestDto,
    });
  };

  /**
   * Регистрирует биометрические ключи с устройства
   */
  const registerBiometric = (
    iRegisterBiometricRequestDto: IRegisterBiometricRequestDto,
  ) => {
    return axiosInstance<IRegisterBiometricResponseDto>({
      url: `/api/biometric/register`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iRegisterBiometricRequestDto,
    });
  };

  /**
   * Генерирует nonce, который необходимо подписать на устройстве
   */
  const generateNonce = (
    iGenerateNonceRequestDto: IGenerateNonceRequestDto,
  ) => {
    return axiosInstance<IGenerateNonceResponseDto>({
      url: `/api/biometric/generate-nonce`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iGenerateNonceRequestDto,
    });
  };

  /**
   * Проверяет подпись и авторизует пользователя
   */
  const verifySignature = (
    iVerifyBiometricSignatureRequestDto: IVerifyBiometricSignatureRequestDto,
  ) => {
    return axiosInstance<IVerifyBiometricSignatureResponseDto>({
      url: `/api/biometric/verify-signature`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iVerifyBiometricSignatureRequestDto,
    });
  };

  /**
   * Список зарегистрированных устройств пользователя
   */
  const getDevices = () => {
    return axiosInstance<IBiometricDevicesResponseDto>({
      url: `/api/biometric/devices`,
      method: "GET",
    });
  };

  /**
   * Удалить зарегистрированное устройство
   */
  const deleteDevice = (deviceId: string) => {
    return axiosInstance<IDeleteBiometricResponseDto>({
      url: `/api/biometric/${deviceId}`,
      method: "DELETE",
    });
  };

  /**
   * Отправить сообщение от имени бота.
   * @summary Bot: отправка сообщения
   */
  const botSendMessage = (iBotSendMessageBody: IBotSendMessageBody) => {
    return axiosInstance<MessageDto>({
      url: `/api/bot-api/message/send`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iBotSendMessageBody,
    });
  };

  /**
   * Редактировать сообщение бота.
   * @summary Bot: редактирование сообщения
   */
  const botEditMessage = (
    id: string,
    iBotEditMessageBody: IBotEditMessageBody,
  ) => {
    return axiosInstance<MessageDto>({
      url: `/api/bot-api/message/${id}/edit`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iBotEditMessageBody,
    });
  };

  /**
   * Удалить сообщение бота.
   * @summary Bot: удаление сообщения
   */
  const botDeleteMessage = (id: string) => {
    return axiosInstance<void>({
      url: `/api/bot-api/message/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary Создать бота
   */
  const createBot = (iCreateBotBody: ICreateBotBody) => {
    return axiosInstance<BotDetailDto>({
      url: `/api/bot`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateBotBody,
    });
  };

  /**
   * @summary Мои боты
   */
  const getMyBots = () => {
    return axiosInstance<BotDto[]>({ url: `/api/bot`, method: "GET" });
  };

  /**
   * @summary Детали бота
   */
  const getBotById = (id: string) => {
    return axiosInstance<BotDetailDto>({
      url: `/api/bot/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary Обновить бота
   */
  const updateBot = (id: string, iUpdateBotBody: IUpdateBotBody) => {
    return axiosInstance<BotDetailDto>({
      url: `/api/bot/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUpdateBotBody,
    });
  };

  /**
   * @summary Удалить бота
   */
  const deleteBot = (id: string) => {
    return axiosInstance<void>({ url: `/api/bot/${id}`, method: "DELETE" });
  };

  /**
   * @summary Перегенерировать токен
   */
  const regenerateToken = (id: string) => {
    return axiosInstance<BotDetailDto>({
      url: `/api/bot/${id}/token`,
      method: "POST",
    });
  };

  /**
   * @summary Установить webhook
   */
  const setWebhook = (id: string, iSetWebhookBody: ISetWebhookBody) => {
    return axiosInstance<BotDetailDto>({
      url: `/api/bot/${id}/webhook`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iSetWebhookBody,
    });
  };

  /**
   * @summary Удалить webhook
   */
  const deleteWebhook = (id: string) => {
    return axiosInstance<void>({
      url: `/api/bot/${id}/webhook`,
      method: "DELETE",
    });
  };

  /**
   * @summary Установить команды бота
   */
  const setCommands = (id: string, iSetCommandsBody: ISetCommandsBody) => {
    return axiosInstance<BotCommandDto[]>({
      url: `/api/bot/${id}/commands`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iSetCommandsBody,
    });
  };

  /**
   * @summary Получить команды бота
   */
  const getCommands = (id: string) => {
    return axiosInstance<BotCommandDto[]>({
      url: `/api/bot/${id}/commands`,
      method: "GET",
    });
  };

  /**
   * @summary Тестировать webhook (отправляет ping)
   */
  const testWebhook = (id: string) => {
    return axiosInstance<IWebhookTestResponse>({
      url: `/api/bot/${id}/webhook/test`,
      method: "POST",
    });
  };

  /**
   * @summary Получить логи доставки webhook
   */
  const getWebhookLogs = (id: string, params?: GetWebhookLogsParams) => {
    return axiosInstance<IWebhookLogsResponse>({
      url: `/api/bot/${id}/webhook/logs`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary Обновить фильтр событий webhook
   */
  const setWebhookEvents = (
    id: string,
    iSetWebhookEventsBody: ISetWebhookEventsBody,
  ) => {
    return axiosInstance<BotDetailDto>({
      url: `/api/bot/${id}/webhook/events`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iSetWebhookEventsBody,
    });
  };

  /**
   * Инициировать звонок.
   * @summary Начать звонок
   */
  const initiateCall = (iInitiateCallBody: IInitiateCallBody) => {
    return axiosInstance<CallDto>({
      url: `/api/call`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iInitiateCallBody,
    });
  };

  /**
   * Ответить на звонок.
   * @summary Ответить
   */
  const answerCall = (id: string) => {
    return axiosInstance<CallDto>({
      url: `/api/call/${id}/answer`,
      method: "POST",
    });
  };

  /**
   * Отклонить звонок.
   * @summary Отклонить
   */
  const declineCall = (id: string) => {
    return axiosInstance<CallDto>({
      url: `/api/call/${id}/decline`,
      method: "POST",
    });
  };

  /**
   * Завершить звонок.
   * @summary Завершить
   */
  const endCall = (id: string) => {
    return axiosInstance<CallDto>({
      url: `/api/call/${id}/end`,
      method: "POST",
    });
  };

  /**
   * Получить историю звонков.
   * @summary История звонков
   */
  const getCallHistory = (params?: GetCallHistoryParams) => {
    return axiosInstance<ICallHistoryDto>({
      url: `/api/call/history`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить активный звонок.
   * @summary Активный звонок
   */
  const getActiveCall = () => {
    return axiosInstance<CallDto | null>({
      url: `/api/call/active`,
      method: "GET",
    });
  };

  /**
   * Установить режим медленной отправки.
   * @summary Медленный режим
   */
  const setSlowMode = (id: string, iSetSlowModeBody: ISetSlowModeBody) => {
    return axiosInstance<SetSlowMode200>({
      url: `/api/chat/${id}/slow-mode`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iSetSlowModeBody,
    });
  };

  /**
   * Заблокировать участника чата.
   * @summary Блокировка участника
   */
  const banMember = (
    id: string,
    userId: string,
    iBanMemberBody: IBanMemberBody,
  ) => {
    return axiosInstance<void>({
      url: `/api/chat/${id}/members/${userId}/ban`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iBanMemberBody,
    });
  };

  /**
   * Разблокировать участника чата.
   * @summary Разблокировка участника
   */
  const unbanMember = (id: string, userId: string) => {
    return axiosInstance<void>({
      url: `/api/chat/${id}/members/${userId}/ban`,
      method: "DELETE",
    });
  };

  /**
   * Получить заблокированных участников.
   * @summary Заблокированные участники
   */
  const getBannedMembers = (id: string) => {
    return axiosInstance<IBannedMemberDto[]>({
      url: `/api/chat/${id}/members/banned`,
      method: "GET",
    });
  };

  /**
   * Создать или получить существующий личный чат.
   * @summary Создание личного чата
   */
  const createDirectChat = (iCreateDirectChatBody: ICreateDirectChatBody) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/direct`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateDirectChatBody,
    });
  };

  /**
   * Создать групповой чат.
   * @summary Создание группового чата
   */
  const createGroupChat = (iCreateGroupChatBody: ICreateGroupChatBody) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/group`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateGroupChatBody,
    });
  };

  /**
   * Создать канал.
   * @summary Создание канала
   */
  const createChannel = (iCreateChannelBody: ICreateChannelBody) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/channel`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateChannelBody,
    });
  };

  /**
   * Обновить канал.
   * @summary Обновление канала
   */
  const updateChannel = (
    id: string,
    iUpdateChannelBody: IUpdateChannelBody,
  ) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/channel/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUpdateChannelBody,
    });
  };

  /**
   * Подписаться на публичный канал.
   * @summary Подписка на канал
   */
  const subscribeToChannel = (id: string) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/channel/${id}/subscribe`,
      method: "POST",
    });
  };

  /**
   * Отписаться от канала.
   * @summary Отписка от канала
   */
  const unsubscribeFromChannel = (id: string) => {
    return axiosInstance<string>({
      url: `/api/chat/channel/${id}/subscribe`,
      method: "DELETE",
    });
  };

  /**
   * Поиск публичных каналов.
   * @summary Поиск каналов
   */
  const searchChannels = (params?: SearchChannelsParams) => {
    return axiosInstance<IChatListDto>({
      url: `/api/chat/channel/search`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить список чатов текущего пользователя.
   * @summary Список чатов
   */
  const getUserChats = (params?: GetUserChatsParams) => {
    return axiosInstance<IChatListDto>({
      url: `/api/chat`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить информацию о чате.
   * @summary Получение чата
   */
  const getChatById = (id: string) => {
    return axiosInstance<ChatDto>({ url: `/api/chat/${id}`, method: "GET" });
  };

  /**
   * Обновить групповой чат (название, аватар).
   * @summary Обновление чата
   */
  const updateChat = (id: string, iUpdateChatBody: IUpdateChatBody) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUpdateChatBody,
    });
  };

  /**
   * Покинуть чат.
   * @summary Выход из чата
   */
  const leaveChat = (id: string) => {
    return axiosInstance<string>({ url: `/api/chat/${id}`, method: "DELETE" });
  };

  /**
   * Создать invite-ссылку для группового чата.
   * @summary Создание invite-ссылки
   */
  const createInviteLink = (
    id: string,
    iCreateInviteBody: ICreateInviteBody,
  ) => {
    return axiosInstance<ChatInviteDto>({
      url: `/api/chat/${id}/invite`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateInviteBody,
    });
  };

  /**
   * Получить список invite-ссылок чата.
   * @summary Список invite-ссылок
   */
  const getInvites = (id: string) => {
    return axiosInstance<ChatInviteDto[]>({
      url: `/api/chat/${id}/invite`,
      method: "GET",
    });
  };

  /**
   * Отозвать invite-ссылку.
   * @summary Отзыв invite-ссылки
   */
  const revokeInvite = (id: string, inviteId: string) => {
    return axiosInstance<void>({
      url: `/api/chat/${id}/invite/${inviteId}`,
      method: "DELETE",
    });
  };

  /**
   * Присоединиться к чату по invite-коду.
   * @summary Вступление по invite-ссылке
   */
  const joinByInvite = (code: string) => {
    return axiosInstance<ChatDto>({
      url: `/api/chat/join/${code}`,
      method: "POST",
    });
  };

  /**
   * Замутить или размутить чат.
   * @summary Мут чата
   */
  const muteChat = (id: string, iMuteChatBody: IMuteChatBody) => {
    return axiosInstance<ChatMemberDto>({
      url: `/api/chat/${id}/mute`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iMuteChatBody,
    });
  };

  /**
   * Добавить участников в групповой чат.
   * @summary Добавление участников
   */
  const addMembers = (id: string, iAddMembersBody: IAddMembersBody) => {
    return axiosInstance<ChatMemberDto[]>({
      url: `/api/chat/${id}/members`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iAddMembersBody,
    });
  };

  /**
   * Удалить участника из группового чата.
   * @summary Удаление участника
   */
  const removeMember = (id: string, userId: string) => {
    return axiosInstance<string>({
      url: `/api/chat/${id}/members/${userId}`,
      method: "DELETE",
    });
  };

  /**
   * Изменить роль участника в групповом чате.
   * @summary Изменение роли участника
   */
  const updateMemberRole = (
    id: string,
    userId: string,
    iUpdateMemberRoleBody: IUpdateMemberRoleBody,
  ) => {
    return axiosInstance<ChatMemberDto>({
      url: `/api/chat/${id}/members/${userId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUpdateMemberRoleBody,
    });
  };

  /**
   * Закрепить чат.
   * @summary Закрепление чата
   */
  const pinChat = (id: string) => {
    return axiosInstance<ChatMemberDto>({
      url: `/api/chat/${id}/pin`,
      method: "POST",
    });
  };

  /**
   * Открепить чат.
   * @summary Открепление чата
   */
  const unpinChat = (id: string) => {
    return axiosInstance<ChatMemberDto>({
      url: `/api/chat/${id}/pin`,
      method: "DELETE",
    });
  };

  /**
   * Переместить чат в папку.
   * @summary Перемещение в папку
   */
  const moveChatToFolder = (
    id: string,
    iMoveChatToFolderBody: IMoveChatToFolderBody,
  ) => {
    return axiosInstance<ChatMemberDto>({
      url: `/api/chat/${id}/folder`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iMoveChatToFolderBody,
    });
  };

  /**
   * Получить список папок чатов.
   * @summary Список папок
   */
  const getUserFolders = () => {
    return axiosInstance<ChatFolderDto[]>({
      url: `/api/chat/folder/list`,
      method: "GET",
    });
  };

  /**
   * Создать папку для чатов.
   * @summary Создание папки
   */
  const createFolder = (iCreateFolderBody: ICreateFolderBody) => {
    return axiosInstance<ChatFolderDto>({
      url: `/api/chat/folder`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateFolderBody,
    });
  };

  /**
   * Обновить папку.
   * @summary Обновление папки
   */
  const updateFolder = (
    folderId: string,
    iUpdateFolderBody: IUpdateFolderBody,
  ) => {
    return axiosInstance<ChatFolderDto>({
      url: `/api/chat/folder/${folderId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUpdateFolderBody,
    });
  };

  /**
   * Удалить папку.
   * @summary Удаление папки
   */
  const deleteFolder = (folderId: string) => {
    return axiosInstance<void>({
      url: `/api/chat/folder/${folderId}`,
      method: "DELETE",
    });
  };

  /**
   * Добавить контакт.
   * @summary Добавление контакта
   */
  const addContact = (iCreateContactBody: ICreateContactBody) => {
    return axiosInstance<ContactDto>({
      url: `/api/contact`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreateContactBody,
    });
  };

  /**
   * Получить список контактов текущего пользователя.
   * @summary Список контактов
   */
  const getContacts = (params?: GetContactsParams) => {
    return axiosInstance<ContactDto[]>({
      url: `/api/contact`,
      method: "GET",
      params,
    });
  };

  /**
   * Принять запрос на добавление в контакты.
   * @summary Принять контакт
   */
  const acceptContact = (id: string) => {
    return axiosInstance<ContactDto>({
      url: `/api/contact/${id}/accept`,
      method: "PATCH",
    });
  };

  /**
   * Удалить контакт.
   * @summary Удаление контакта
   */
  const removeContact = (id: string) => {
    return axiosInstance<string>({
      url: `/api/contact/${id}`,
      method: "DELETE",
    });
  };

  /**
   * Заблокировать контакт.
   * @summary Блокировка контакта
   */
  const blockContact = (id: string) => {
    return axiosInstance<ContactDto>({
      url: `/api/contact/${id}/block`,
      method: "POST",
    });
  };

  /**
   * Получить файл по ID.
   * Этот эндпоинт позволяет пользователю получить файл по его уникальному ID.
   * Он защищен с использованием JWT-аутентификации, что означает, что только аутентифицированные пользователи могут получить доступ к этому ресурсу.
   * @summary Получение файла по ID
   */
  const getFileById = (params: GetFileByIdParams) => {
    return axiosInstance<IFileDto>({ url: `/api/file`, method: "GET", params });
  };

  /**
   * Загрузить файл.
   * Этот эндпоинт позволяет пользователю загрузить один файл на сервер.
   * Он защищен с использованием JWT-аутентификации, что означает, что только аутентифицированные пользователи могут загружать файлы.
   * @summary Загрузка файла
   */
  const uploadFile = (uploadFileBody: UploadFileBody) => {
    const formData = new FormData();
    formData.append(`file`, uploadFileBody.file);

    return axiosInstance<IFileDto[]>({
      url: `/api/file`,
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      data: formData,
    });
  };

  /**
   * Удалить файл.
   * Этот эндпоинт позволяет пользователю удалить файл по его ID. Доступ разрешен только пользователю, который загрузил файл, либо администратору.
   * @summary Удаление файла
   */
  const deleteFile = (id: string) => {
    return axiosInstance<boolean>({ url: `/api/file/${id}`, method: "DELETE" });
  };

  /**
   * Отправить сообщение в чат.
   * @summary Отправка сообщения
   */
  const sendMessage = (chatId: string, iSendMessageBody: ISendMessageBody) => {
    return axiosInstance<MessageDto>({
      url: `/api/chat/${chatId}/message`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iSendMessageBody,
    });
  };

  /**
   * Получить сообщения чата с cursor-based пагинацией.
   * - `before` — загрузить старые сообщения (скролл вверх)
   * - `after` — загрузить новые сообщения (скролл вниз из detached окна)
   * - `around` — загрузить окно вокруг конкретного сообщения (навигация)
   * - без параметров — последние сообщения
   * @summary Список сообщений
   */
  const getMessages = (chatId: string, params?: GetMessagesParams) => {
    return axiosInstance<IMessageListDto>({
      url: `/api/chat/${chatId}/message`,
      method: "GET",
      params,
    });
  };

  /**
   * Поиск сообщений в чате.
   * @summary Поиск в чате
   */
  const searchChatMessages = (
    chatId: string,
    params: SearchChatMessagesParams,
  ) => {
    return axiosInstance<IMessageSearchDto>({
      url: `/api/chat/${chatId}/message/search`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить закреплённые сообщения чата.
   * @summary Закреплённые сообщения
   */
  const getPinnedMessages = (chatId: string) => {
    return axiosInstance<MessageDto[]>({
      url: `/api/chat/${chatId}/message/pinned`,
      method: "GET",
    });
  };

  /**
   * Получить медиафайлы чата.
   * @summary Медиа-галерея чата
   */
  const getChatMedia = (chatId: string, params?: GetChatMediaParams) => {
    return axiosInstance<IMediaGalleryDto>({
      url: `/api/chat/${chatId}/media`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить статистику медиафайлов чата.
   * @summary Статистика медиа
   */
  const getChatMediaStats = (chatId: string) => {
    return axiosInstance<IMediaStatsDto>({
      url: `/api/chat/${chatId}/media/stats`,
      method: "GET",
    });
  };

  /**
   * Отметить сообщения как прочитанные.
   * @summary Прочитать сообщения
   */
  const markAsRead = (chatId: string, iMarkReadBody: IMarkReadBody) => {
    return axiosInstance<void>({
      url: `/api/chat/${chatId}/message/read`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iMarkReadBody,
    });
  };

  /**
   * Глобальный поиск по сообщениям во всех чатах пользователя.
   * @summary Глобальный поиск сообщений
   */
  const searchMessages = (params: SearchMessagesParams) => {
    return axiosInstance<IMessageSearchDto>({
      url: `/api/message/search`,
      method: "GET",
      params,
    });
  };

  /**
   * Отредактировать сообщение.
   * @summary Редактирование сообщения
   */
  const editMessage = (id: string, iEditMessageBody: IEditMessageBody) => {
    return axiosInstance<MessageDto>({
      url: `/api/message/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iEditMessageBody,
    });
  };

  /**
   * Удалить сообщение. forAll=true — для всех, forAll=false — только для себя.
   * @summary Удаление сообщения
   */
  const deleteMessage = (id: string, params?: DeleteMessageParams) => {
    return axiosInstance<void>({
      url: `/api/message/${id}`,
      method: "DELETE",
      params,
    });
  };

  /**
   * Добавить реакцию на сообщение.
   * @summary Добавление реакции
   */
  const addReaction = (id: string, iAddReactionBody: IAddReactionBody) => {
    return axiosInstance<void>({
      url: `/api/message/${id}/reaction`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iAddReactionBody,
    });
  };

  /**
   * Удалить реакцию с сообщения.
   * @summary Удаление реакции
   */
  const removeReaction = (id: string) => {
    return axiosInstance<void>({
      url: `/api/message/${id}/reaction`,
      method: "DELETE",
    });
  };

  /**
   * Закрепить сообщение.
   * @summary Закрепление сообщения
   */
  const pinMessage = (id: string) => {
    return axiosInstance<MessageDto>({
      url: `/api/message/${id}/pin`,
      method: "POST",
    });
  };

  /**
   * Открепить сообщение.
   * @summary Открепление сообщения
   */
  const unpinMessage = (id: string) => {
    return axiosInstance<void>({
      url: `/api/message/${id}/pin`,
      method: "DELETE",
    });
  };

  /**
   * Получить информацию о прочтении сообщения (кто прочитал, кто получил).
   * Доступно для участников чата.
   * @summary Информация о прочтении сообщения
   */
  const getReceiptInfo = (id: string) => {
    return axiosInstance<MessageReceiptDto[]>({
      url: `/api/message/${id}/receipts`,
      method: "GET",
    });
  };

  /**
   * Генерирует параметры для регистрации нового passkey.
   * Требует авторизации — passkey привязывается к текущему пользователю.
   * @summary Параметры регистрации passkey
   */
  const generateRegistrationOptions = () => {
    return axiosInstance<PublicKeyCredentialCreationOptionsJSON>({
      url: `/api/passkeys/generate-registration-options`,
      method: "POST",
    });
  };

  /**
   * Верифицирует ответ устройства и сохраняет passkey для текущего пользователя.
   * @summary Верификация регистрации passkey
   */
  const verifyRegistration = (
    iVerifyRegistrationRequestDto: IVerifyRegistrationRequestDto,
  ) => {
    return axiosInstance<IVerifyRegistrationResponseDto>({
      url: `/api/passkeys/verify-registration`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iVerifyRegistrationRequestDto,
    });
  };

  /**
   * Генерирует параметры для аутентификации по passkey.
   * Принимает login (email или телефон) пользователя.
   * @summary Параметры аутентификации passkey
   */
  const generateAuthenticationOptions = (
    iGenerateAuthenticationOptionsRequestDto: IGenerateAuthenticationOptionsRequestDto,
  ) => {
    return axiosInstance<PublicKeyCredentialRequestOptionsJSON>({
      url: `/api/passkeys/generate-authentication-options`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iGenerateAuthenticationOptionsRequestDto,
    });
  };

  /**
   * Верифицирует ответ устройства и возвращает токены при успехе.
   * @summary Аутентификация по passkey
   */
  const verifyAuthentication = (
    iVerifyAuthenticationRequestDto: IVerifyAuthenticationRequestDto,
  ) => {
    return axiosInstance<IVerifyAuthenticationResponseDto>({
      url: `/api/passkeys/verify-authentication`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iVerifyAuthenticationRequestDto,
    });
  };

  /**
   * Создать опрос в чате.
   * @summary Создание опроса
   */
  const createPoll = (chatId: string, iCreatePollBody: ICreatePollBody) => {
    return axiosInstance<PollDto>({
      url: `/api/chat/${chatId}/poll`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iCreatePollBody,
    });
  };

  /**
   * Проголосовать в опросе.
   * @summary Голосование
   */
  const vote = (id: string, iVotePollBody: IVotePollBody) => {
    return axiosInstance<PollDto>({
      url: `/api/poll/${id}/vote`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iVotePollBody,
    });
  };

  /**
   * Отозвать голос.
   * @summary Отзыв голоса
   */
  const retractVote = (id: string) => {
    return axiosInstance<PollDto>({
      url: `/api/poll/${id}/vote`,
      method: "DELETE",
    });
  };

  /**
   * Закрыть опрос.
   * @summary Закрытие опроса
   */
  const closePoll = (id: string) => {
    return axiosInstance<PollDto>({
      url: `/api/poll/${id}/close`,
      method: "POST",
    });
  };

  /**
   * Получить опрос по ID.
   * @summary Получение опроса
   */
  const getPoll = (id: string) => {
    return axiosInstance<PollDto>({ url: `/api/poll/${id}`, method: "GET" });
  };

  /**
   * Зарегистрировать устройство для push-уведомлений.
   * @summary Регистрация устройства
   */
  const registerDevice = (iRegisterDeviceBody: IRegisterDeviceBody) => {
    return axiosInstance<DeviceTokenDto>({
      url: `/api/device`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: iRegisterDeviceBody,
    });
  };

  /**
   * Удалить устройство из push-уведомлений.
   * @summary Удаление устройства
   */
  const unregisterDevice = (token: string) => {
    return axiosInstance<void>({
      url: `/api/device/${token}`,
      method: "DELETE",
    });
  };

  /**
   * Получить настройки уведомлений текущего пользователя.
   * @summary Настройки уведомлений
   */
  const getSettings = () => {
    return axiosInstance<NotificationSettingsDto>({
      url: `/api/notification/settings`,
      method: "GET",
    });
  };

  /**
   * Обновить настройки уведомлений.
   * @summary Обновление настроек уведомлений
   */
  const updateSettings = (
    iUpdateNotificationSettingsBody: IUpdateNotificationSettingsBody,
  ) => {
    return axiosInstance<NotificationSettingsDto>({
      url: `/api/notification/settings`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: iUpdateNotificationSettingsBody,
    });
  };

  /**
   * Получить изменения с указанной версии (компактифицированные).
   * Если версия клиента устарела — вернёт requiresSnapshot: true.
   * @summary Incremental sync
   */
  const getChanges = (params?: GetChangesParams) => {
    return axiosInstance<ISyncResponseDto>({
      url: `/api/sync`,
      method: "GET",
      params,
    });
  };

  /**
   * Получить текущую sync version.
   * Используется при первом запуске для установки начальной точки синхронизации.
   * @summary Current sync version
   */
  const getVersion = () => {
    return axiosInstance<ISyncVersionDto>({
      url: `/api/sync/version`,
      method: "GET",
    });
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
