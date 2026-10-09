import type {
  AgentAlertDto,
  AgentDto,
  ApiResponseDto,
  DemoEchoJob201,
  GetAgentAlertsParams,
  GetAgentConfigsParams,
  GetAgentEnrollmentTokensParams,
  GetAgentEventsParams,
  GetAgentLogsParams,
  GetAgentMetricsParams,
  GetAgentsParams,
  GetJobParams,
  GetMyAuditParams,
  GetMyFilesParams,
  GetNodeOptionsParams,
  GetNodesParams,
  GetPasskeysParams,
  GetProfilesParams,
  GetSessionsParams,
  GetUserOptionsParams,
  GetUsersParams,
  IAgentConfigEntryDto,
  IAgentFetchBody,
  IAgentInstallCommandDto,
  IAgentLogsDto,
  IAgentMetricsPointDto,
  IAgentReleaseDto,
  IAgentUpdateResultDto,
  IAgentWorkerActionBody,
  IAgentWorkerActionResultDto,
  IAssignNodeBody,
  IBiometricDevicesResponseDto,
  ICreateAgentEnrollmentTokenBody,
  ICreateAgentInstallCommandBody,
  ICreateApiKeyBody,
  ICreateNodeBody,
  ICreateNodeInstallCommandBody,
  ICreateRoleRequestDto,
  ICreateUploadBody,
  ICreatedAgentEnrollmentTokenDto,
  ICreatedApiKeyDto,
  ICursorPageDtoAuditEventDto,
  ICursorPageDtoIAgentEventDto,
  IDemoEchoData,
  IDirectUploadDto,
  IDisable2FARequestDto,
  IEnable2FARequestDto,
  IFileDto,
  IGenerateAuthenticationOptionsRequestDto,
  IGenerateNonceRequestDto,
  IGenerateNonceResponseDto,
  IInstallNodeAgentBody,
  INodeInstallCommandDto,
  INodeJobStartedDto,
  INodeMeshDto,
  IPaginatedDtoAgentDto,
  IPaginatedDtoAgentEnrollmentTokenDto,
  IPaginatedDtoApiKeyDto,
  IPaginatedDtoIFileDto,
  IPaginatedDtoJobRunDto,
  IPaginatedDtoNodeDto,
  IPaginatedDtoPasskeyDto,
  IPaginatedDtoSessionDto,
  IPermissionCatalogDto,
  IProfileListDto,
  IProfileUpdateRequestDto,
  IRefreshRequestDto,
  IRegisterBiometricRequestDto,
  IRegisterBiometricResponseDto,
  IRoleDto,
  IRolePermissionsRequestDto,
  ISetAgentConfigBody,
  ISignInRequestDto,
  ISignInResponseDto,
  ITokensDto,
  IUninstallNodeAgentBody,
  IUpdateNodeBody,
  IUserAdminListDto,
  IUserChangePasswordDto,
  IUserConfirmEmailChangeDto,
  IUserDeleteDto,
  IUserListDto,
  IUserLoginRequestDto,
  IUserOptionsDto,
  IUserPrivilegesRequestDto,
  IUserResetPasswordRequestDto,
  IUserUpdateRequestDto,
  IUserVerifyEmailDto,
  IUserWithTokensDto,
  IVerify2FARequestDto,
  IVerifyAuthenticationRequestDto,
  IVerifyAuthenticationResponseDto,
  IVerifyBiometricSignatureRequestDto,
  IVerifyBiometricSignatureResponseDto,
  IVerifyRegistrationRequestDto,
  IVerifyRegistrationResponseDto,
  JobRunDto,
  ListApiKeysParams,
  ListAuditEventsParams,
  ListJobsParams,
  NodeDto,
  NodeOptionDto,
  PrivacySettingsDto,
  ProfileDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicProfileDto,
  PublicUserDto,
  SearchUsersParams,
  SetUsernameBody,
  TAgentId,
  TAgentWorkerName,
  TSignUpRequestDto,
  UpdatePrivacySettingsBody,
  UploadFileBody,
  UserDto,
  Uuid,
} from "./model";

import { mainMutator } from "../../main/main.mutator";
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getRestApi = () => {
  /**
   * Каталог прав по группам с подписями — для редакторов ролей и прав
   * пользователей. Первая группа — «Система» (полный доступ `*`).
   * @summary Каталог прав
   */
  const getPermissionCatalog = (
    options?: SecondParameter<typeof mainMutator<IPermissionCatalogDto>>,
  ) => {
    return mainMutator<IPermissionCatalogDto>(
      { url: `/api/v1/permissions`, method: "GET" },
      options,
    );
  };

  /**
   * Файлы, новые первыми. По умолчанию — свои; `mine=false` при праве
   * `file:view` — все файлы (с правом только на свои — по-прежнему свои).
   * Ссылки в ответе подписаны и действуют ограниченное время.
   * @summary Файлы (по умолчанию — свои)
   */
  const getMyFiles = (
    params?: GetMyFilesParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoIFileDto>>,
  ) => {
    return mainMutator<IPaginatedDtoIFileDto>(
      { url: `/api/v1/file`, method: "GET", params },
      options,
    );
  };

  /**
   * Загрузить небольшой файл (multipart, до 100 MB). Допустимы только типы
   * из белого списка; расширение, заявленный mime и сигнатура содержимого
   * должны совпадать, иначе 415. Медиа обрабатывается в фоне: файл
   * возвращается в статусе `processing`, по готовности приходит
   * `file:processed`.
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
        url: `/api/v1/file`,
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        data: formData,
      },
      options,
    );
  };

  /**
   * Метаданные файла и подписанные ссылки на него. Свой файл — с правом
   * `file:view:own`, любой — с `file:view`; недоступный файл — 404.
   * @summary Получение файла по ID
   */
  const getFileById = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<IFileDto>>,
  ) => {
    return mainMutator<IFileDto>(
      { url: `/api/v1/file/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Удалить файл вместе с производными версиями. Свой — с правом
   * `file:delete:own`, любой — с `file:delete`; недоступный файл — 404,
   * видимый без права на удаление — 403; используемый файл (вложение) — 409.
   * @summary Удаление файла
   */
  const deleteFile = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/file/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Начать прямую загрузку крупного файла: возвращает подписанную ссылку
   * для `PUT` (с заголовками из `headers`, тело — ровно `size` байт).
   * После загрузки — `POST /uploads/{fileId}/complete`. Неподтверждённая
   * загрузка удаляется через сутки.
   * @summary Прямая загрузка: получить ссылку
   */
  const createUpload = (
    iCreateUploadBody: ICreateUploadBody,
    options?: SecondParameter<typeof mainMutator<IDirectUploadDto>>,
  ) => {
    return mainMutator<IDirectUploadDto>(
      {
        url: `/api/v1/file/uploads`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateUploadBody,
      },
      options,
    );
  };

  /**
   * Завершить прямую загрузку: проверяются размер и сигнатура, затем
   * медиа ставится в фоновую обработку. Повторный вызов безопасен.
   * @summary Прямая загрузка: завершить
   */
  const completeUpload = (
    fileId: Uuid,
    options?: SecondParameter<typeof mainMutator<IFileDto>>,
  ) => {
    return mainMutator<IFileDto>(
      { url: `/api/v1/file/uploads/${fileId}/complete`, method: "POST" },
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
      { url: `/api/v1/profile/my`, method: "GET" },
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
        url: `/api/v1/profile/my/update`,
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
      { url: `/api/v1/profile/my/privacy`, method: "GET" },
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
        url: `/api/v1/profile/my/privacy`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: updatePrivacySettingsBody,
      },
      options,
    );
  };

  /**
   * Очистить профиль текущего пользователя.
   * Личные данные (имя, фамилия, дата рождения, пол, аватар) обнуляются,
   * сама запись профиля остаётся.
   * @summary Очистка профиля текущего пользователя
   */
  const deleteMyProfile = (
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/profile/my/delete`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить все профили постранично, новые первыми.
   * @summary Получение всех профилей
   */
  const getProfiles = (
    params?: GetProfilesParams,
    options?: SecondParameter<typeof mainMutator<IProfileListDto>>,
  ) => {
    return mainMutator<IProfileListDto>(
      { url: `/api/v1/profile/all`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить профиль по ID.
   * Этот эндпоинт позволяет получить профиль другого пользователя по его ID. Доступен только для администраторов.
   * @summary Получение профиля по ID
   */
  const getProfileById = (
    userId: Uuid,
    options?: SecondParameter<typeof mainMutator<PublicProfileDto>>,
  ) => {
    return mainMutator<PublicProfileDto>(
      { url: `/api/v1/profile/${userId}`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить профиль другого пользователя.
   * Этот эндпоинт позволяет администраторам обновлять профиль других пользователей.
   * @summary Обновление профиля другого пользователя
   */
  const updateProfile = (
    userId: Uuid,
    iProfileUpdateRequestDto: IProfileUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<ProfileDto>>,
  ) => {
    return mainMutator<ProfileDto>(
      {
        url: `/api/v1/profile/update/${userId}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iProfileUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Очистить профиль другого пользователя.
   * Личные данные обнуляются, запись профиля остаётся.
   * @summary Очистка профиля другого пользователя
   */
  const deleteProfile = (
    userId: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/profile/delete/${userId}`, method: "DELETE" },
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
      { url: `/api/v1/roles`, method: "GET" },
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
        url: `/api/v1/roles`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateRoleRequestDto,
      },
      options,
    );
  };

  /**
   * Удалить роль. Системные роли (`admin`, `user`, `guest`) не удаляются,
   * собственную роль удаляет только суперпользователь.
   * @summary Удаление роли
   */
  const deleteRole = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/roles/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Установить права для роли.
   * Заменяет текущий набор прав роли указанным. Роль `admin`, право `*` и
   * собственную роль меняет только суперпользователь. Все пользователи роли
   * получают `user:privileges-changed` с новыми правами; их прежние
   * access-токены отклоняются (`AUTH_PRIVILEGES_CHANGED`), сессии остаются.
   * @summary Установка прав роли
   */
  const setRolePermissions = (
    id: Uuid,
    iRolePermissionsRequestDto: IRolePermissionsRequestDto,
    options?: SecondParameter<typeof mainMutator<IRoleDto>>,
  ) => {
    return mainMutator<IRoleDto>(
      {
        url: `/api/v1/roles/${id}/permissions`,
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
      { url: `/api/v1/user/my`, method: "GET" },
      options,
    );
  };

  /**
   * Обновить email и/или телефон текущего пользователя.
   * Телефон меняется сразу. Email — нет: создаётся запрос на смену, код
   * уходит на новый адрес, уведомление — на старый; адрес меняется после
   * `POST my/email/confirm`. Повторный запрос — не чаще раза в минуту (429).
   * Занятые email/телефон → 409 (`USER_EMAIL_TAKEN` / `USER_PHONE_TAKEN`).
   * @summary Обновление данных текущего пользователя
   */
  const updateMyUser = (
    iUserUpdateRequestDto: IUserUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/v1/user/my/update`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUserUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Подтвердить смену email кодом из письма на новый адрес. Email
   * меняется и считается подтверждённым. Неверный код расходует попытку
   * (`USER_EMAIL_CHANGE_INVALID_CODE`, в `details.attemptsLeft` — остаток);
   * после 5 неверных или по истечении 15 минут запрос аннулируется.
   * @summary Подтверждение смены email
   */
  const confirmEmailChange = (
    iUserConfirmEmailChangeDto: IUserConfirmEmailChangeDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/v1/user/my/email/confirm`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserConfirmEmailChangeDto,
      },
      options,
    );
  };

  /**
   * Удалить текущего пользователя. Требуется текущий пароль.
   * POST, а не DELETE: тело DELETE-запроса не разбирается body-parser-ом.
   * @summary Удаление текущего пользователя
   */
  const deleteMyUser = (
    iUserDeleteDto: IUserDeleteDto,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/v1/user/my/delete`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserDeleteDto,
      },
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
        url: `/api/v1/user/my/username`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: setUsernameBody,
      },
      options,
    );
  };

  /**
   * Поиск пользователей по username, имени и фамилии.
   * Email в ответе не отдаётся; телефон — по настройке приватности `showPhone`.
   * @summary Поиск пользователей
   */
  const searchUsers = (
    params: SearchUsersParams,
    options?: SecondParameter<typeof mainMutator<IUserListDto>>,
  ) => {
    return mainMutator<IUserListDto>(
      { url: `/api/v1/user/search`, method: "GET", params },
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
      { url: `/api/v1/user/by-username/${username}`, method: "GET" },
      options,
    );
  };

  /**
   * Получить пользователей постранично (администрирование), новые первыми.
   * @summary Получение всех пользователей
   */
  const getUsers = (
    params?: GetUsersParams,
    options?: SecondParameter<typeof mainMutator<IUserAdminListDto>>,
  ) => {
    return mainMutator<IUserAdminListDto>(
      { url: `/api/v1/user/all`, method: "GET", params },
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
      { url: `/api/v1/user/options`, method: "GET", params },
      options,
    );
  };

  /**
   * Получить пользователя по ID.
   * @summary Получение пользователя по ID
   */
  const getUserById = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      { url: `/api/v1/user/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Установить роли и прямые права пользователя.
   * Роли и права должны существовать. Свои привилегии менять нельзя; роль
   * `admin` и право `*` выдаёт только суперпользователь.
   * @summary Установка привилегий для пользователя
   */
  const setPrivileges = (
    id: Uuid,
    iUserPrivilegesRequestDto: IUserPrivilegesRequestDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/v1/user/setPrivileges/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUserPrivilegesRequestDto,
      },
      options,
    );
  };

  /**
   * Отправить код подтверждения на email текущего пользователя.
   * Повторная отправка — не чаще раза в минуту (429).
   * @summary Запрос подтверждения email
   */
  const requestVerifyEmail = (
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/user/verify-email/request`, method: "POST" },
      options,
    );
  };

  /**
   * Подтвердить email текущего пользователя кодом из письма.
   * @summary Подтверждение email-адреса
   */
  const verifyEmail = (
    iUserVerifyEmailDto: IUserVerifyEmailDto,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/v1/user/verify-email`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserVerifyEmailDto,
      },
      options,
    );
  };

  /**
   * Обновить email/телефон другого пользователя — сразу, без подтверждения
   * кодом. Новый email сбрасывает `emailVerified`.
   * @summary Обновление другого пользователя
   */
  const updateUser = (
    id: Uuid,
    iUserUpdateRequestDto: IUserUpdateRequestDto,
    options?: SecondParameter<typeof mainMutator<UserDto>>,
  ) => {
    return mainMutator<UserDto>(
      {
        url: `/api/v1/user/update/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUserUpdateRequestDto,
      },
      options,
    );
  };

  /**
   * Изменить пароль текущего пользователя. Требуется текущий пароль;
   * остальные сессии завершаются, текущая остаётся.
   * @summary Изменение пароля
   */
  const changePassword = (
    iUserChangePasswordDto: IUserChangePasswordDto,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/v1/user/changePassword`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUserChangePasswordDto,
      },
      options,
    );
  };

  /**
   * Удалить другого пользователя. Себя и суперпользователя удалить нельзя.
   * @summary Удаление другого пользователя
   */
  const deleteUser = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/user/delete/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Получить список активных сессий пользователя (последние активные — первыми).
   * @summary Список сессий
   */
  const getSessions = (
    params?: GetSessionsParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoSessionDto>>,
  ) => {
    return mainMutator<IPaginatedDtoSessionDto>(
      { url: `/api/v1/session`, method: "GET", params },
      options,
    );
  };

  /**
   * Завершить конкретную сессию: её access-токен сразу перестаёт действовать.
   * @summary Завершение сессии
   */
  const terminateSession = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/session/${id}`, method: "DELETE" },
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
      { url: `/api/v1/session/terminate-others`, method: "POST" },
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
        url: `/api/v1/auth/sign-up`,
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
        url: `/api/v1/auth/sign-in`,
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
        url: `/api/v1/auth/request-reset-password`,
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
        url: `/api/v1/auth/reset-password`,
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
    iRefreshRequestDto: IRefreshRequestDto,
    options?: SecondParameter<typeof mainMutator<ITokensDto>>,
  ) => {
    return mainMutator<ITokensDto>(
      {
        url: `/api/v1/auth/refresh`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iRefreshRequestDto,
      },
      options,
    );
  };

  /**
   * Выйти из текущей сессии: сессия завершается, access-токен сразу
   * перестаёт действовать, cookie с refresh-токеном очищается.
   * @summary Выход
   */
  const signOut = (options?: SecondParameter<typeof mainMutator<void>>) => {
    return mainMutator<void>(
      { url: `/api/v1/auth/sign-out`, method: "POST" },
      options,
    );
  };

  /**
   * Выйти со всех устройств, включая текущее: все сессии завершаются,
   * их access-токены сразу перестают действовать.
   * @summary Выход со всех устройств
   */
  const signOutAll = (options?: SecondParameter<typeof mainMutator<void>>) => {
    return mainMutator<void>(
      { url: `/api/v1/auth/sign-out-all`, method: "POST" },
      options,
    );
  };

  /**
   * Включить двухфакторную аутентификацию. Требует текущий пароль аккаунта.
   * @summary Включение 2FA
   */
  const enable2FA = (
    iEnable2FARequestDto: IEnable2FARequestDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/v1/auth/enable-2fa`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iEnable2FARequestDto,
      },
      options,
    );
  };

  /**
   * Отключить двухфакторную аутентификацию. Требует текущий пароль аккаунта
   * и пароль 2FA.
   * @summary Отключение 2FA
   */
  const disable2FA = (
    iDisable2FARequestDto: IDisable2FARequestDto,
    options?: SecondParameter<typeof mainMutator<ApiResponseDto>>,
  ) => {
    return mainMutator<ApiResponseDto>(
      {
        url: `/api/v1/auth/disable-2fa`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iDisable2FARequestDto,
      },
      options,
    );
  };

  /**
   * Верифицировать 2FA и получить токены. Токен 2FA одноразовый; после
   * нескольких неверных паролей вход по 2FA временно блокируется.
   * @summary Верификация 2FA
   */
  const verify2FA = (
    iVerify2FARequestDto: IVerify2FARequestDto,
    options?: SecondParameter<typeof mainMutator<IUserWithTokensDto>>,
  ) => {
    return mainMutator<IUserWithTokensDto>(
      {
        url: `/api/v1/auth/verify-2fa`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerify2FARequestDto,
      },
      options,
    );
  };

  /**
   * Список passkeys текущего пользователя (новые — первыми).
   * @summary Мои passkeys
   */
  const getPasskeys = (
    params?: GetPasskeysParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoPasskeyDto>>,
  ) => {
    return mainMutator<IPaginatedDtoPasskeyDto>(
      { url: `/api/v1/passkeys`, method: "GET", params },
      options,
    );
  };

  /**
   * Удаляет passkey текущего пользователя.
   * @summary Удаление passkey
   */
  const deletePasskey = (
    id: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/passkeys/${id}`, method: "DELETE" },
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
      { url: `/api/v1/passkeys/generate-registration-options`, method: "POST" },
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
        url: `/api/v1/passkeys/verify-registration`,
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
        url: `/api/v1/passkeys/generate-authentication-options`,
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
        url: `/api/v1/passkeys/verify-authentication`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerifyAuthenticationRequestDto,
      },
      options,
    );
  };

  /**
   * Агенты в порядке регистрации: связь, узел, воркеры (состояние,
   * самочувствие, манифест, настройки), последняя точка метрик, проблемы.
   * Право `agent:view` — все агенты, иначе — доступные через политику.
   * @summary Список агентов
   */
  const getAgents = (
    params?: GetAgentsParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoAgentDto>>,
  ) => {
    return mainMutator<IPaginatedDtoAgentDto>(
      { url: `/api/v1/agents`, method: "GET", params },
      options,
    );
  };

  /**
   * Текущие проблемы: агент без связи, воркер упал, не зарегистрирован, не в
   * порядке, отказал в настройке. Без `agentId` — у всех доступных агентов.
   * @summary Проблемы агентов
   */
  const getAgentAlerts = (
    params?: GetAgentAlertsParams,
    options?: SecondParameter<typeof mainMutator<AgentAlertDto[]>>,
  ) => {
    return mainMutator<AgentAlertDto[]>(
      { url: `/api/v1/agents/alerts`, method: "GET", params },
      options,
    );
  };

  /**
   * События воркеров, новые первыми: фильтр по агенту, воркеру и типу;
   * следующая страница — `cursor` из ответа.
   * @summary Лента событий воркеров
   */
  const getAgentEvents = (
    params?: GetAgentEventsParams,
    options?: SecondParameter<typeof mainMutator<ICursorPageDtoIAgentEventDto>>,
  ) => {
    return mainMutator<ICursorPageDtoIAgentEventDto>(
      { url: `/api/v1/agents/events`, method: "GET", params },
      options,
    );
  };

  /**
   * Агент: `hello` (версия, узел, воркеры), последний `status` (воркеры с
   * `state`, `health`, `pending`, манифестом и итогами настроек), метрики,
   * проблемы, процесс с соединением.
   * @summary Агент
   */
  const getAgent = (
    id: TAgentId,
    options?: SecondParameter<typeof mainMutator<AgentDto>>,
  ) => {
    return mainMutator<AgentDto>(
      { url: `/api/v1/agents/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Удалить запись агента, его настройки и историю; соединение закрывается.
   * Агент с токеном регистрации зарегистрируется заново — уже другим.
   * @summary Удаление агента
   */
  const deleteAgent = (
    id: TAgentId,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/agents/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Отозвать агента: ключ больше не принимается, соединение закрывается.
   * Повторный отзыв — тот же ответ.
   * @summary Отзыв агента
   */
  const revokeAgent = (
    id: TAgentId,
    options?: SecondParameter<typeof mainMutator<AgentDto>>,
  ) => {
    return mainMutator<AgentDto>(
      { url: `/api/v1/agents/${id}/revoke`, method: "POST" },
      options,
    );
  };

  /**
   * Сменить ключ агента: агент создаёт новый секрет и переподключается с
   * ним. Агент должен быть на связи.
   * @summary Смена ключа агента
   */
  const rotateAgentKey = (
    id: TAgentId,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/agents/${id}/rotate-key`, method: "POST" },
      options,
    );
  };

  /**
   * Обновить агента до версии выпуска (источник выпусков агента — по
   * умолчанию GitHub): итог — после запуска новой версии. Агент в контейнере
   * себя не обновляет.
   * @summary Обновление агента
   */
  const updateAgent = (
    id: TAgentId,
    options?: SecondParameter<typeof mainMutator<IAgentUpdateResultDto>>,
  ) => {
    return mainMutator<IAgentUpdateResultDto>(
      { url: `/api/v1/agents/${id}/update`, method: "POST" },
      options,
    );
  };

  /**
   * Последние строки журнала с узла: агента или воркера (`worker`).
   * @summary Журнал агента
   */
  const getAgentLogs = (
    id: TAgentId,
    params?: GetAgentLogsParams,
    options?: SecondParameter<typeof mainMutator<IAgentLogsDto>>,
  ) => {
    return mainMutator<IAgentLogsDto>(
      { url: `/api/v1/agents/${id}/logs`, method: "GET", params },
      options,
    );
  };

  /**
   * История метрик агента по возрастанию времени: узел (`host`) и ответы
   * `GET /metrics` воркеров (`workers`). Окно — `since` (строго позже) и
   * `until` (мс), из него — последние `limit` точек.
   * @summary История метрик агента
   */
  const getAgentMetrics = (
    id: TAgentId,
    params?: GetAgentMetricsParams,
    options?: SecondParameter<typeof mainMutator<IAgentMetricsPointDto[]>>,
  ) => {
    return mainMutator<IAgentMetricsPointDto[]>(
      { url: `/api/v1/agents/${id}/metrics`, method: "GET", params },
      options,
    );
  };

  /**
   * Выпустить токен регистрации агентов. Полный токен (`token`) — только в
   * этом ответе: он кладётся в настройки агента (`enroll.token`) или в
   * команду установки. `maxUses` не задан — многоразовый (парк машин).
   * @summary Выпуск токена регистрации
   */
  const createAgentEnrollmentToken = (
    iCreateAgentEnrollmentTokenBody: ICreateAgentEnrollmentTokenBody,
    options?: SecondParameter<
      typeof mainMutator<ICreatedAgentEnrollmentTokenDto>
    >,
  ) => {
    return mainMutator<ICreatedAgentEnrollmentTokenDto>(
      {
        url: `/api/v1/agent-enrollment-tokens`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateAgentEnrollmentTokenBody,
      },
      options,
    );
  };

  /**
   * Токены регистрации, новые первыми; секреты не возвращаются.
   * @summary Список токенов регистрации
   */
  const getAgentEnrollmentTokens = (
    params?: GetAgentEnrollmentTokensParams,
    options?: SecondParameter<
      typeof mainMutator<IPaginatedDtoAgentEnrollmentTokenDto>
    >,
  ) => {
    return mainMutator<IPaginatedDtoAgentEnrollmentTokenDto>(
      { url: `/api/v1/agent-enrollment-tokens`, method: "GET", params },
      options,
    );
  };

  /**
   * Отозвать токен: новые регистрации по нему невозможны, агенты остаются.
   * Повторный отзыв — 204.
   * @summary Отзыв токена регистрации
   */
  const revokeAgentEnrollmentToken = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/agent-enrollment-tokens/${id}/revoke`, method: "POST" },
      options,
    );
  };

  /**
   * Выпуск, который раздаёт бэкенд: агент и netprobe — из источника выпусков
   * агента (по умолчанию GitHub, `remote` — версия и когда проверен),
   * воркеры проекта — из `AGENT_RELEASES_DIR`; у каждой сборки — источник.
   * И кого из доступных агентов можно обновить: агентов и воркеры из выпуска.
   * @summary Выпуск агента
   */
  const getAgentRelease = (
    options?: SecondParameter<typeof mainMutator<IAgentReleaseDto>>,
  ) => {
    return mainMutator<IAgentReleaseDto>(
      { url: `/api/v1/agent-releases`, method: "GET" },
      options,
    );
  };

  /**
   * Команда установки агента на новый узел одной строкой:
   * `curl …/api/v1/agent-link/install.sh | sudo sh -s -- --token … [флаги]`
   * (воркеры из выпуска — `workers`, флаг `--worker`).
   * @summary Команда установки агента
   */
  const createAgentInstallCommand = (
    iCreateAgentInstallCommandBody: ICreateAgentInstallCommandBody,
    options?: SecondParameter<typeof mainMutator<IAgentInstallCommandDto>>,
  ) => {
    return mainMutator<IAgentInstallCommandDto>(
      {
        url: `/api/v1/agent-releases/install-command`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateAgentInstallCommandBody,
      },
      options,
    );
  };

  /**
   * Перезапустить воркер. Свободный — перезапускается сразу (`deferred:
   * false` после запуска). Занятый (`health.busy`) — ответ сразу (`deferred:
   * true`, `pending`, `actionId`), замена — после окончания работы, её итог —
   * событие сокета `agent:action` (`id = actionId`, `deferred: true`);
   * `force` — заменить сразу.
   * @summary Перезапуск воркера
   */
  const restartAgentWorker = (
    id: TAgentId,
    worker: TAgentWorkerName,
    iAgentWorkerActionBody: IAgentWorkerActionBody,
    options?: SecondParameter<typeof mainMutator<IAgentWorkerActionResultDto>>,
  ) => {
    return mainMutator<IAgentWorkerActionResultDto>(
      {
        url: `/api/v1/agents/${id}/workers/${worker}/restart`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iAgentWorkerActionBody,
      },
      options,
    );
  };

  /**
   * Обновить воркер из выпуска до новейшей сборки под агента. Свободный — сразу
   * (версии в ответе); занятый — как у перезапуска: ответ `deferred: true`,
   * итог — событие `agent:action`; `force` — сразу. Новая сборка не
   * заработала — агент возвращает прежнюю.
   * @summary Обновление воркера
   */
  const updateAgentWorker = (
    id: TAgentId,
    worker: TAgentWorkerName,
    iAgentWorkerActionBody: IAgentWorkerActionBody,
    options?: SecondParameter<typeof mainMutator<IAgentWorkerActionResultDto>>,
  ) => {
    return mainMutator<IAgentWorkerActionResultDto>(
      {
        url: `/api/v1/agents/${id}/workers/${worker}/update`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iAgentWorkerActionBody,
      },
      options,
    );
  };

  /**
   * Запрос к воркеру через агента: метод, путь, заголовки, тело. Ответ —
   * статус, заголовки и тело воркера потоком и заголовок
   * `X-Agent-Worker-Status` (статус ответа воркера): по нему ответ воркера
   * отличается от ошибки API (её тело — `{ code, message }`, заголовка нет).
   * Служебные пути воркера (`/health`, `/metrics`, `/config/*`, `/cleanup`)
   * недоступны. В аудит попадают изменяющие запросы (`POST`, `PUT`, `PATCH`,
   * `DELETE`).
   * @summary Запрос к воркеру
   */
  const fetchAgentWorker = (
    id: TAgentId,
    worker: TAgentWorkerName,
    iAgentFetchBody: IAgentFetchBody,
    options?: SecondParameter<typeof mainMutator<Blob>>,
  ) => {
    return mainMutator<Blob>(
      {
        url: `/api/v1/agents/${id}/workers/${worker}/fetch`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iAgentFetchBody,
        responseType: "blob",
      },
      options,
    );
  };

  /**
   * Ключи настроек агента (или одного воркера): значение и статус
   * применения — желаемая, доставленная и применённая версии, ошибка.
   * @summary Настройки воркеров агента
   */
  const getAgentConfigs = (
    id: TAgentId,
    params?: GetAgentConfigsParams,
    options?: SecondParameter<typeof mainMutator<IAgentConfigEntryDto[]>>,
  ) => {
    return mainMutator<IAgentConfigEntryDto[]>(
      { url: `/api/v1/agents/${id}/configs`, method: "GET", params },
      options,
    );
  };

  /**
   * Ключ настроек воркера: значение и статус применения.
   * @summary Настройка воркера
   */
  const getAgentWorkerConfig = (
    id: TAgentId,
    worker: TAgentWorkerName,
    key: TAgentWorkerName,
    options?: SecondParameter<typeof mainMutator<IAgentConfigEntryDto>>,
  ) => {
    return mainMutator<IAgentConfigEntryDto>(
      {
        url: `/api/v1/agents/${id}/workers/${worker}/configs/${key}`,
        method: "GET",
      },
      options,
    );
  };

  /**
   * Записать значение ключа (новая версия). Значение проверяется по схеме
   * ключа из манифеста воркера (400 `AGENT_CONFIG_INVALID`); агент получит
   * его сразу или при подключении, итог — в статусе и событии сокета.
   * @summary Запись настройки воркера
   */
  const setAgentWorkerConfig = (
    id: TAgentId,
    worker: TAgentWorkerName,
    key: TAgentWorkerName,
    iSetAgentConfigBody: ISetAgentConfigBody,
    options?: SecondParameter<typeof mainMutator<IAgentConfigEntryDto>>,
  ) => {
    return mainMutator<IAgentConfigEntryDto>(
      {
        url: `/api/v1/agents/${id}/workers/${worker}/configs/${key}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        data: iSetAgentConfigBody,
      },
      options,
    );
  };

  /**
   * Удалить ключ: агент удалит его у себя и у воркера. Ключа нет — 404.
   * @summary Удаление настройки воркера
   */
  const deleteAgentWorkerConfig = (
    id: TAgentId,
    worker: TAgentWorkerName,
    key: TAgentWorkerName,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/v1/agents/${id}/workers/${worker}/configs/${key}`,
        method: "DELETE",
      },
      options,
    );
  };

  /**
   * Видимые задачи: свои, либо задачи scope (`scopeType` + `scopeId`), если
   * политика scope разрешает просмотр. Новые — первыми.
   * @summary Список задач
   */
  const listJobs = (
    params?: ListJobsParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoJobRunDto>>,
  ) => {
    return mainMutator<IPaginatedDtoJobRunDto>(
      { url: `/api/v1/jobs`, method: "GET", params },
      options,
    );
  };

  /**
   * Задача: статус, прогресс, хвост лога, результат или ошибка.
   *
   * `waitSeconds` (0–25) — long-poll: незавершённую задачу сервер держит
   * запрос открытым и отвечает, как только она завершится, или через
   * `waitSeconds` — с текущим прогрессом. Клиент повторяет запрос, пока статус
   * не итоговый: так результат ждут сколько угодно без таймаутов прокси.
   * @summary Задача
   */
  const getJob = (
    id: Uuid,
    params?: GetJobParams,
    options?: SecondParameter<typeof mainMutator<JobRunDto>>,
  ) => {
    return mainMutator<JobRunDto>(
      { url: `/api/v1/jobs/${id}`, method: "GET", params },
      options,
    );
  };

  /**
   * Отменить задачу: ждущая снимается сразу, выполняющаяся получает сигнал
   * отмены. Завершённую отменить нельзя (409).
   * @summary Отмена задачи
   */
  const cancelJob = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/jobs/${id}/cancel`, method: "POST" },
      options,
    );
  };

  /**
   * Поставить демо-задачу `demo.echo` воркеру `echo` агента — проверка, что
   * агенты на связи. Быстрая (`echo.quick`) — итог сразу (`lookup` — воркер
   * берёт префикс у сервера запросом `echo.lookup`); долгая (`long`,
   * `echo.long`) — `steps` шагов по `delayMs` с ходом, `fail` — провал после
   * шагов, `withOutput` — итог ещё и в файл хранилища по подписанной ссылке.
   * Итог — текст по настройкам воркера.
   * @summary Проверка агентов
   */
  const demoEchoJob = (
    iDemoEchoData: IDemoEchoData,
    options?: SecondParameter<typeof mainMutator<DemoEchoJob201>>,
  ) => {
    return mainMutator<DemoEchoJob201>(
      {
        url: `/api/v1/jobs/demo/echo`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iDemoEchoData,
      },
      options,
    );
  };

  /**
   * Узлы, новые первыми: владелец и создатель с именами, вычисленный статус,
   * агент кратко (связь, версия, адрес, обновление), сводка конфигурации,
   * последняя задача установки. С правом `node:view:own` — только свои.
   * @summary Список узлов
   */
  const getNodes = (
    params?: GetNodesParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoNodeDto>>,
  ) => {
    return mainMutator<IPaginatedDtoNodeDto>(
      { url: `/api/v1/nodes`, method: "GET", params },
      options,
    );
  };

  /**
   * Создать узел. Создатель — автор запроса; владелец, отличный от себя, —
   * только с правом `node:assign`. Агента ставят командой установки или по
   * SSH.
   * @summary Создание узла
   */
  const createNode = (
    iCreateNodeBody: ICreateNodeBody,
    options?: SecondParameter<typeof mainMutator<NodeDto>>,
  ) => {
    return mainMutator<NodeDto>(
      {
        url: `/api/v1/nodes`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateNodeBody,
      },
      options,
    );
  };

  /**
   * Краткий список узлов для выпадающих списков (в рамках прав).
   * @summary Узлы для выбора
   */
  const getNodeOptions = (
    params?: GetNodeOptionsParams,
    options?: SecondParameter<typeof mainMutator<NodeOptionDto[]>>,
  ) => {
    return mainMutator<NodeOptionDto[]>(
      { url: `/api/v1/nodes/options`, method: "GET", params },
      options,
    );
  };

  /**
   * Матрица связности узлов «откуда → куда»: средние задержка и потери за 5
   * минут по измерениям воркера проверки сети (`netprobe`) агентов узлов.
   * С правом `node:view:own` — только между своими узлами.
   * @summary Связность узлов
   */
  const getNodeMesh = (
    options?: SecondParameter<typeof mainMutator<INodeMeshDto>>,
  ) => {
    return mainMutator<INodeMeshDto>(
      { url: `/api/v1/nodes/mesh`, method: "GET" },
      options,
    );
  };

  /**
   * Узел по id; чужой без права на все узлы — 404.
   * @summary Узел
   */
  const getNodeById = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<NodeDto>>,
  ) => {
    return mainMutator<NodeDto>(
      { url: `/api/v1/nodes/${id}`, method: "GET" },
      options,
    );
  };

  /**
   * Изменить узел: переданные поля заменяются.
   * @summary Изменение узла
   */
  const updateNode = (
    id: Uuid,
    iUpdateNodeBody: IUpdateNodeBody,
    options?: SecondParameter<typeof mainMutator<NodeDto>>,
  ) => {
    return mainMutator<NodeDto>(
      {
        url: `/api/v1/nodes/${id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: iUpdateNodeBody,
      },
      options,
    );
  };

  /**
   * Удалить узел; его агент отзывается и удаляется (программа на машине
   * остаётся — удалить её можно заранее задачей удаления по SSH).
   * @summary Удаление узла
   */
  const deleteNode = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/nodes/${id}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Назначить владельца узла (узел станет для него своим).
   * @summary Назначение владельца узла
   */
  const assignNodeOwner = (
    id: Uuid,
    iAssignNodeBody: IAssignNodeBody,
    options?: SecondParameter<typeof mainMutator<NodeDto>>,
  ) => {
    return mainMutator<NodeDto>(
      {
        url: `/api/v1/nodes/${id}/assign`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iAssignNodeBody,
      },
      options,
    );
  };

  /**
   * Снять владельца узла.
   * @summary Снятие владельца узла
   */
  const unassignNodeOwner = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<NodeDto>>,
  ) => {
    return mainMutator<NodeDto>(
      { url: `/api/v1/nodes/${id}/unassign`, method: "POST" },
      options,
    );
  };

  /**
   * Команда установки агента на узел вручную: одноразовый токен регистрации
   * с меткой узла (агент привяжется к узлу) и строка `curl … | sudo sh`.
   * Токен — только в этом ответе.
   * @summary Команда установки агента узла
   */
  const createNodeInstallCommand = (
    id: Uuid,
    iCreateNodeInstallCommandBody: ICreateNodeInstallCommandBody,
    options?: SecondParameter<typeof mainMutator<INodeInstallCommandDto>>,
  ) => {
    return mainMutator<INodeInstallCommandDto>(
      {
        url: `/api/v1/nodes/${id}/install-command`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateNodeInstallCommandBody,
      },
      options,
    );
  };

  /**
   * Установить агента по SSH (задача): установщик с этого сервера и
   * одноразовый токен файлом. Прогресс и журнал — в задаче (`jobId`,
   * комната узла). SSH-данные шифруются и в открытом виде не хранятся. Уже
   * идёт установка или удаление — 409.
   * @summary Установка агента по SSH
   */
  const installNodeAgent = (
    id: Uuid,
    iInstallNodeAgentBody: IInstallNodeAgentBody,
    options?: SecondParameter<typeof mainMutator<INodeJobStartedDto>>,
  ) => {
    return mainMutator<INodeJobStartedDto>(
      {
        url: `/api/v1/nodes/${id}/agent/install`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iInstallNodeAgentBody,
      },
      options,
    );
  };

  /**
   * Удалить агента с узла по SSH (задача): `install.sh --uninstall`
   * (`purge` — и данные), затем агент отзывается и удаляется, узел остаётся
   * без агента. Уже идёт установка или удаление — 409.
   * @summary Удаление агента по SSH
   */
  const uninstallNodeAgent = (
    id: Uuid,
    iUninstallNodeAgentBody: IUninstallNodeAgentBody,
    options?: SecondParameter<typeof mainMutator<INodeJobStartedDto>>,
  ) => {
    return mainMutator<INodeJobStartedDto>(
      {
        url: `/api/v1/nodes/${id}/agent/uninstall`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iUninstallNodeAgentBody,
      },
      options,
    );
  };

  /**
   * Регистрирует публичный ключ устройства для входа по биометрии.
   * @summary Регистрация биометрии
   */
  const registerBiometric = (
    iRegisterBiometricRequestDto: IRegisterBiometricRequestDto,
    options?: SecondParameter<
      typeof mainMutator<IRegisterBiometricResponseDto>
    >,
  ) => {
    return mainMutator<IRegisterBiometricResponseDto>(
      {
        url: `/api/v1/biometric/register`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iRegisterBiometricRequestDto,
      },
      options,
    );
  };

  /**
   * Выдаёт одноразовый nonce (5 минут), который устройство подписывает своим
   * ключом. Публичный: вызывается до входа.
   * @summary Nonce для биометрического входа
   */
  const generateNonce = (
    iGenerateNonceRequestDto: IGenerateNonceRequestDto,
    options?: SecondParameter<typeof mainMutator<IGenerateNonceResponseDto>>,
  ) => {
    return mainMutator<IGenerateNonceResponseDto>(
      {
        url: `/api/v1/biometric/generate-nonce`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iGenerateNonceRequestDto,
      },
      options,
    );
  };

  /**
   * Проверяет подпись nonce и открывает новую сессию. Публичный; nonce
   * одноразовый — одна попытка на nonce.
   * @summary Вход по биометрии
   */
  const verifySignature = (
    iVerifyBiometricSignatureRequestDto: IVerifyBiometricSignatureRequestDto,
    options?: SecondParameter<
      typeof mainMutator<IVerifyBiometricSignatureResponseDto>
    >,
  ) => {
    return mainMutator<IVerifyBiometricSignatureResponseDto>(
      {
        url: `/api/v1/biometric/verify-signature`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iVerifyBiometricSignatureRequestDto,
      },
      options,
    );
  };

  /**
   * Список зарегистрированных устройств пользователя.
   * @summary Мои биометрические устройства
   */
  const getDevices = (
    options?: SecondParameter<typeof mainMutator<IBiometricDevicesResponseDto>>,
  ) => {
    return mainMutator<IBiometricDevicesResponseDto>(
      { url: `/api/v1/biometric/devices`, method: "GET" },
      options,
    );
  };

  /**
   * Удаляет зарегистрированное устройство.
   * @summary Удаление биометрического устройства
   */
  const deleteDevice = (
    deviceId: string,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/biometric/${deviceId}`, method: "DELETE" },
      options,
    );
  };

  /**
   * Журнал безопасности текущего пользователя: входы (в том числе
   * неудачные), блокировки, 2FA, смена пароля, сессии, passkeys, биометрия.
   * Новые — первыми.
   * @summary Мой журнал безопасности
   */
  const getMyAudit = (
    params?: GetMyAuditParams,
    options?: SecondParameter<typeof mainMutator<ICursorPageDtoAuditEventDto>>,
  ) => {
    return mainMutator<ICursorPageDtoAuditEventDto>(
      { url: `/api/v1/audit/my`, method: "GET", params },
      options,
    );
  };

  /**
   * Журнал безопасности всех пользователей. Требует право `audit:view`.
   * @summary Журнал безопасности
   */
  const listAuditEvents = (
    params?: ListAuditEventsParams,
    options?: SecondParameter<typeof mainMutator<ICursorPageDtoAuditEventDto>>,
  ) => {
    return mainMutator<ICursorPageDtoAuditEventDto>(
      { url: `/api/v1/audit`, method: "GET", params },
      options,
    );
  };

  /**
   * Выпустить API-ключ сервиса. Полный ключ (`key`) возвращается только в
   * этом ответе — сохраните его: в БД хранится лишь хеш.
   * @summary Создание API-ключа
   */
  const createApiKey = (
    iCreateApiKeyBody: ICreateApiKeyBody,
    options?: SecondParameter<typeof mainMutator<ICreatedApiKeyDto>>,
  ) => {
    return mainMutator<ICreatedApiKeyDto>(
      {
        url: `/api/v1/api-keys`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCreateApiKeyBody,
      },
      options,
    );
  };

  /**
   * Все API-ключи, новые первыми. Секреты не возвращаются.
   * @summary Список API-ключей
   */
  const listApiKeys = (
    params?: ListApiKeysParams,
    options?: SecondParameter<typeof mainMutator<IPaginatedDtoApiKeyDto>>,
  ) => {
    return mainMutator<IPaginatedDtoApiKeyDto>(
      { url: `/api/v1/api-keys`, method: "GET", params },
      options,
    );
  };

  /**
   * Отозвать ключ: запросы с ним сразу получают 401. Повторный отзыв — 204.
   * @summary Отзыв API-ключа
   */
  const revokeApiKey = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      { url: `/api/v1/api-keys/${id}/revoke`, method: "POST" },
      options,
    );
  };

  return {
    getPermissionCatalog,
    getMyFiles,
    uploadFile,
    getFileById,
    deleteFile,
    createUpload,
    completeUpload,
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
    confirmEmailChange,
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
    getSessions,
    terminateSession,
    terminateOtherSessions,
    signUp,
    signIn,
    requestResetPassword,
    resetPassword,
    refresh,
    signOut,
    signOutAll,
    enable2FA,
    disable2FA,
    verify2FA,
    getPasskeys,
    deletePasskey,
    generateRegistrationOptions,
    verifyRegistration,
    generateAuthenticationOptions,
    verifyAuthentication,
    getAgents,
    getAgentAlerts,
    getAgentEvents,
    getAgent,
    deleteAgent,
    revokeAgent,
    rotateAgentKey,
    updateAgent,
    getAgentLogs,
    getAgentMetrics,
    createAgentEnrollmentToken,
    getAgentEnrollmentTokens,
    revokeAgentEnrollmentToken,
    getAgentRelease,
    createAgentInstallCommand,
    restartAgentWorker,
    updateAgentWorker,
    fetchAgentWorker,
    getAgentConfigs,
    getAgentWorkerConfig,
    setAgentWorkerConfig,
    deleteAgentWorkerConfig,
    listJobs,
    getJob,
    cancelJob,
    demoEchoJob,
    getNodes,
    createNode,
    getNodeOptions,
    getNodeMesh,
    getNodeById,
    updateNode,
    deleteNode,
    assignNodeOwner,
    unassignNodeOwner,
    createNodeInstallCommand,
    installNodeAgent,
    uninstallNodeAgent,
    registerBiometric,
    generateNonce,
    verifySignature,
    getDevices,
    deleteDevice,
    getMyAudit,
    listAuditEvents,
    createApiKey,
    listApiKeys,
    revokeApiKey,
  };
};
export type GetPermissionCatalogResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getPermissionCatalog"]>>
>;
export type GetMyFilesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getMyFiles"]>>
>;
export type UploadFileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["uploadFile"]>>
>;
export type GetFileByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getFileById"]>>
>;
export type DeleteFileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteFile"]>>
>;
export type CreateUploadResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createUpload"]>>
>;
export type CompleteUploadResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["completeUpload"]>>
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
export type ConfirmEmailChangeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["confirmEmailChange"]>>
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
export type GetSessionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getSessions"]>>
>;
export type TerminateSessionResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["terminateSession"]>>
>;
export type TerminateOtherSessionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["terminateOtherSessions"]>>
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
export type SignOutResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["signOut"]>>
>;
export type SignOutAllResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["signOutAll"]>>
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
export type GetPasskeysResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getPasskeys"]>>
>;
export type DeletePasskeyResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deletePasskey"]>>
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
export type GetAgentsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgents"]>>
>;
export type GetAgentAlertsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentAlerts"]>>
>;
export type GetAgentEventsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentEvents"]>>
>;
export type GetAgentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgent"]>>
>;
export type DeleteAgentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteAgent"]>>
>;
export type RevokeAgentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["revokeAgent"]>>
>;
export type RotateAgentKeyResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["rotateAgentKey"]>>
>;
export type UpdateAgentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateAgent"]>>
>;
export type GetAgentLogsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentLogs"]>>
>;
export type GetAgentMetricsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentMetrics"]>>
>;
export type CreateAgentEnrollmentTokenResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getRestApi>["createAgentEnrollmentToken"]>
  >
>;
export type GetAgentEnrollmentTokensResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentEnrollmentTokens"]>>
>;
export type RevokeAgentEnrollmentTokenResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getRestApi>["revokeAgentEnrollmentToken"]>
  >
>;
export type GetAgentReleaseResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentRelease"]>>
>;
export type CreateAgentInstallCommandResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getRestApi>["createAgentInstallCommand"]>
  >
>;
export type RestartAgentWorkerResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["restartAgentWorker"]>>
>;
export type UpdateAgentWorkerResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateAgentWorker"]>>
>;
export type FetchAgentWorkerResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["fetchAgentWorker"]>>
>;
export type GetAgentConfigsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentConfigs"]>>
>;
export type GetAgentWorkerConfigResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getAgentWorkerConfig"]>>
>;
export type SetAgentWorkerConfigResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["setAgentWorkerConfig"]>>
>;
export type DeleteAgentWorkerConfigResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteAgentWorkerConfig"]>>
>;
export type ListJobsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["listJobs"]>>
>;
export type GetJobResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getJob"]>>
>;
export type CancelJobResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["cancelJob"]>>
>;
export type DemoEchoJobResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["demoEchoJob"]>>
>;
export type GetNodesResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getNodes"]>>
>;
export type CreateNodeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createNode"]>>
>;
export type GetNodeOptionsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getNodeOptions"]>>
>;
export type GetNodeMeshResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getNodeMesh"]>>
>;
export type GetNodeByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getNodeById"]>>
>;
export type UpdateNodeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["updateNode"]>>
>;
export type DeleteNodeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["deleteNode"]>>
>;
export type AssignNodeOwnerResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["assignNodeOwner"]>>
>;
export type UnassignNodeOwnerResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["unassignNodeOwner"]>>
>;
export type CreateNodeInstallCommandResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createNodeInstallCommand"]>>
>;
export type InstallNodeAgentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["installNodeAgent"]>>
>;
export type UninstallNodeAgentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["uninstallNodeAgent"]>>
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
export type GetMyAuditResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getMyAudit"]>>
>;
export type ListAuditEventsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["listAuditEvents"]>>
>;
export type CreateApiKeyResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["createApiKey"]>>
>;
export type ListApiKeysResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["listApiKeys"]>>
>;
export type RevokeApiKeyResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["revokeApiKey"]>>
>;
