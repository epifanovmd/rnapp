import type {
  ApiResponseDto,
  DemoEchoJob201,
  GetMyAuditParams,
  GetMyFilesParams,
  GetPasskeysParams,
  GetProfilesParams,
  GetSessionsParams,
  GetUserOptionsParams,
  GetUsersParams,
  IBiometricDevicesResponseDto,
  IClaimJobsBody,
  IClaimedJobDto,
  ICompleteJobBody,
  ICreateApiKeyBody,
  ICreateRoleRequestDto,
  ICreateUploadBody,
  ICreatedApiKeyDto,
  ICursorPageDtoAuditEventDto,
  IDemoEchoData,
  IDirectUploadDto,
  IDisable2FARequestDto,
  IEnable2FARequestDto,
  IFailJobBody,
  IFileDto,
  IGenerateAuthenticationOptionsRequestDto,
  IGenerateNonceRequestDto,
  IGenerateNonceResponseDto,
  IHeartbeatJobBody,
  IHeartbeatResultDto,
  IPaginatedDtoApiKeyDto,
  IPaginatedDtoIFileDto,
  IPaginatedDtoJobRunDto,
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
  ISignInRequestDto,
  ISignInResponseDto,
  ITokensDto,
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
  IWorkerQueueStatusDto,
  JobRunDto,
  ListApiKeysParams,
  ListAuditEventsParams,
  ListJobsParams,
  PrivacySettingsDto,
  ProfileDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicProfileDto,
  PublicUserDto,
  SearchUsersParams,
  SetUsernameBody,
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
   * Файлы текущего пользователя, новые первыми. Ссылки в ответе подписаны
   * и действуют ограниченное время.
   * @summary Мои файлы
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
   * Метаданные файла и подписанные ссылки на него.
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
   * Удалить файл вместе с производными версиями. Доступно владельцу и
   * суперпользователю; файл, прикреплённый к сообщению, удалить нельзя (409).
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
   * @summary Задача
   */
  const getJob = (
    id: Uuid,
    options?: SecondParameter<typeof mainMutator<JobRunDto>>,
  ) => {
    return mainMutator<JobRunDto>(
      { url: `/api/v1/jobs/${id}`, method: "GET" },
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
   * Поставить демо-задачу `demo.echo` внешнему воркеру — проверка, что
   * воркеры подключены (`python/examples/echo_worker.py`). Только для админов.
   * @summary Проверка внешних воркеров
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
   * Внешние очереди и воркеры: кто брал задачи и на связи ли сейчас (брал в
   * последние 90 с). Для индикатора «воркер доступен» в интерфейсе.
   * @summary Статус воркеров
   */
  const status = (
    options?: SecondParameter<typeof mainMutator<IWorkerQueueStatusDto[]>>,
  ) => {
    return mainMutator<IWorkerQueueStatusDto[]>(
      { url: `/api/v1/worker/status`, method: "GET" },
      options,
    );
  };

  /**
   * Взять задачи из очередей. Long-poll: без задач ждёт до `waitSeconds`
   * (не больше 25 с) и возвращает пустой список. Каждая задача выдаётся в
   * аренду на `leaseSeconds`; без heartbeat она вернётся в очередь.
   * @summary Взять задачи
   */
  const claim = (
    iClaimJobsBody: IClaimJobsBody,
    options?: SecondParameter<typeof mainMutator<IClaimedJobDto[]>>,
  ) => {
    return mainMutator<IClaimedJobDto[]>(
      {
        url: `/api/v1/worker/jobs/claim`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iClaimJobsBody,
      },
      options,
    );
  };

  /**
   * Продлить аренду и сообщить прогресс. `cancel: true` — задачу отменили
   * или аренда потеряна: прекратить работу и не вызывать complete.
   * @summary Heartbeat задачи
   */
  const heartbeat = (
    id: Uuid,
    iHeartbeatJobBody: IHeartbeatJobBody,
    options?: SecondParameter<typeof mainMutator<IHeartbeatResultDto>>,
  ) => {
    return mainMutator<IHeartbeatResultDto>(
      {
        url: `/api/v1/worker/jobs/${id}/heartbeat`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iHeartbeatJobBody,
      },
      options,
    );
  };

  /**
   * Завершить задачу с результатом. 409 — аренда потеряна или задачу
   * отменили: результат не принят.
   * @summary Завершить задачу
   */
  const complete = (
    id: Uuid,
    iCompleteJobBody: ICompleteJobBody,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/v1/worker/jobs/${id}/complete`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iCompleteJobBody,
      },
      options,
    );
  };

  /**
   * Сообщить об ошибке. `retryable: false` — без повторов; иначе задача
   * повторяется по политике очереди.
   * @summary Ошибка задачи
   */
  const fail = (
    id: Uuid,
    iFailJobBody: IFailJobBody,
    options?: SecondParameter<typeof mainMutator<void>>,
  ) => {
    return mainMutator<void>(
      {
        url: `/api/v1/worker/jobs/${id}/fail`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iFailJobBody,
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
    getMyFiles,
    uploadFile,
    getFileById,
    deleteFile,
    createUpload,
    completeUpload,
    getPermissionCatalog,
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
    listJobs,
    getJob,
    cancelJob,
    demoEchoJob,
    status,
    claim,
    heartbeat,
    complete,
    fail,
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
export type GetPermissionCatalogResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["getPermissionCatalog"]>>
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
export type StatusResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["status"]>>
>;
export type ClaimResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["claim"]>>
>;
export type HeartbeatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["heartbeat"]>>
>;
export type CompleteResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["complete"]>>
>;
export type FailResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getRestApi>["fail"]>>
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
