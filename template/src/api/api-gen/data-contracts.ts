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

export enum EDevicePlatform {
  Ios = "ios",
  Android = "android",
  Web = "web",
}

export enum AttestationConveyancePreference {
  Direct = "direct",
  Enterprise = "enterprise",
  Indirect = "indirect",
  None = "none",
}

export enum UserVerificationRequirement {
  Discouraged = "discouraged",
  Preferred = "preferred",
  Required = "required",
}

export enum ResidentKeyRequirement {
  Discouraged = "discouraged",
  Preferred = "preferred",
  Required = "required",
}

export enum AuthenticatorAttachment {
  CrossPlatform = "cross-platform",
  Platform = "platform",
}

/**
 * A super class of TypeScript's `AuthenticatorTransport` that includes support for the latest
 * transports. Should eventually be replaced by TypeScript's when TypeScript gets updated to
 * know about it (sometime after 4.6.3)
 */
export enum AuthenticatorTransportFuture {
  Ble = "ble",
  Cable = "cable",
  Hybrid = "hybrid",
  Internal = "internal",
  Nfc = "nfc",
  SmartCard = "smart-card",
  Usb = "usb",
}

export enum PublicKeyCredentialType {
  PublicKey = "public-key",
}

export enum EMessageType {
  Text = "text",
  Image = "image",
  File = "file",
  Voice = "voice",
  System = "system",
}

export enum EContactStatus {
  Pending = "pending",
  Accepted = "accepted",
  Blocked = "blocked",
}

export enum EChatMemberRole {
  Owner = "owner",
  Admin = "admin",
  Member = "member",
}

export enum EChatType {
  Direct = "direct",
  Group = "group",
}

export enum EProfileStatus {
  Online = "online",
  Offline = "offline",
}

export enum EPermissions {
  Value = "*",
  UserView = "user:view",
  UserManage = "user:manage",
  ContactView = "contact:view",
  ContactManage = "contact:manage",
  Contact = "contact:*",
  ChatView = "chat:view",
  ChatManage = "chat:manage",
  Chat = "chat:*",
  MessageView = "message:view",
  MessageManage = "message:manage",
  Message = "message:*",
  PushManage = "push:manage",
}

export enum ERole {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

export interface ProfileDto {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  /** @format date-time */
  birthDate?: string | null;
  gender?: string;
  status?: string;
  /** @format date-time */
  lastOnline?: string | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  user?: UserDto;
}

export interface IPermissionDto {
  id: string;
  name: EPermissions;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface IRoleDto {
  id: string;
  name: ERole;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  permissions: IPermissionDto[];
}

export interface UserDto {
  id: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  profile?: ProfileDto;
  roles: IRoleDto[];
  directPermissions: IPermissionDto[];
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface IProfileUpdateRequestDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
  /** @format date-time */
  birthDate?: string;
  gender?: string;
  status?: EProfileStatus;
}

export interface PublicProfileDto {
  id: string;
  firstName?: string;
  lastName?: string;
  status: EProfileStatus;
  /** @format date-time */
  lastOnline?: string;
}

export interface IProfileListDto {
  /** @format double */
  count?: number;
  /** @format double */
  totalCount?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: PublicProfileDto[];
}

export interface IRolePermissionsRequestDto {
  permissions: EPermissions[];
}

export interface IUserUpdateRequestDto {
  email?: string;
  phone?: string;
  roleId?: string;
}

export interface PublicUserDto {
  userId: string;
  email: string;
  profile: PublicProfileDto;
}

export interface IUserListDto {
  /** @format double */
  count?: number;
  /** @format double */
  totalCount?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: PublicUserDto[];
}

export interface IUserOptionDto {
  id: string;
  name: string;
}

export interface IUserOptionsDto {
  data: IUserOptionDto[];
}

export interface IUserPrivilegesRequestDto {
  /** Роли для назначения пользователю (заменяет текущие роли). */
  roles: ERole[];
  /**
   * Прямые разрешения, выданные этому пользователю дополнительно к разрешениям ролей.
   * Заменяет текущие прямые разрешения.
   */
  permissions: EPermissions[];
}

export interface ApiResponseDto {
  message?: string;
  data?: any;
}

export interface IUserChangePasswordDto {
  password: string;
}

export interface ITokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface IUserWithTokensDto {
  id: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  profile?: ProfileDto;
  roles: IRoleDto[];
  directPermissions: IPermissionDto[];
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  tokens: ITokensDto;
}

export type TSignUpRequestDto = {
  password: string;
  lastName?: string;
  firstName?: string;
} & (
  | {
      phone: string;
      email?: string;
    }
  | {
      phone?: string;
      email: string;
    }
);

export interface ISignInRequestDto {
  /** Может быть телефоном, email-ом и username-ом */
  login: string;
  password: string;
}

export interface IUserLoginRequestDto {
  /** Может быть телефоном, email-ом и username-ом */
  login: string;
}

export interface IUserResetPasswordRequestDto {
  password: string;
  token: string;
}

export interface IRegisterBiometricResponseDto {
  registered: boolean;
}

export interface IRegisterBiometricRequestDto {
  deviceId: string;
  deviceName: string;
  publicKey: string;
}

export interface IGenerateNonceResponseDto {
  nonce: string;
}

export interface IGenerateNonceRequestDto {
  deviceId: string;
}

export interface IVerifyBiometricSignatureResponseDto {
  verified: boolean;
  tokens: {
    refreshToken: string;
    accessToken: string;
  };
}

export interface IVerifyBiometricSignatureRequestDto {
  deviceId: string;
  signature: string;
}

export interface IBiometricDeviceDto {
  id: string;
  deviceId: string;
  deviceName: string;
  /** @format date-time */
  lastUsedAt: string;
  /** @format date-time */
  createdAt: string;
}

export interface IBiometricDevicesResponseDto {
  devices: IBiometricDeviceDto[];
}

export interface IDeleteBiometricResponseDto {
  deleted: boolean;
}

export interface ChatMemberDto {
  id: string;
  userId: string;
  role: EChatMemberRole;
  /** @format date-time */
  joinedAt: string;
  /** @format date-time */
  mutedUntil: string | null;
  profile?: PublicProfileDto;
}

export interface ChatDto {
  id: string;
  type: EChatType;
  name: string | null;
  avatarUrl: string | null;
  createdById: string;
  /** @format date-time */
  lastMessageAt: string | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  members: ChatMemberDto[];
}

export interface ICreateDirectChatBody {
  targetUserId: string;
}

export interface ICreateGroupChatBody {
  name: string;
  memberIds: string[];
  avatarId?: string;
}

export interface IChatListDto {
  /** @format double */
  count?: number;
  /** @format double */
  totalCount?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: ChatDto[];
}

export interface IUpdateChatBody {
  name?: string;
  avatarId?: string | null;
}

export interface IAddMembersBody {
  memberIds: string[];
}

export interface IUpdateMemberRoleBody {
  role: EChatMemberRole;
}

export interface ContactDto {
  id: string;
  userId: string;
  contactUserId: string;
  displayName: string | null;
  status: EContactStatus;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  contactProfile?: PublicProfileDto;
}

export interface ICreateContactBody {
  contactUserId: string;
  displayName?: string;
}

export interface IFileDto {
  id: string;
  name: string;
  type: string;
  url: string;
  /** @format double */
  size: number;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string;
  type: EMessageType;
  content: string | null;
  replyToId: string | null;
  forwardedFromId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  sender?: {
    avatarUrl?: string;
    lastName?: string;
    firstName?: string;
    id: string;
  };
  replyTo?: MessageDto | null;
  attachments: MessageAttachmentDto[];
}

export interface MessageAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  /** @format double */
  fileSize: number;
}

export interface ISendMessageBody {
  type?: EMessageType;
  content?: string;
  replyToId?: string;
  forwardedFromId?: string;
  fileIds?: string[];
}

export interface IMessageListDto {
  data: MessageDto[];
  hasMore: boolean;
}

export interface IMarkReadBody {
  messageId: string;
}

export interface IEditMessageBody {
  content: string;
}

export interface PublicKeyCredentialRpEntity {
  name: string;
  id?: string;
}

/** https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentityjson */
export interface PublicKeyCredentialUserEntityJSON {
  id: string;
  name: string;
  displayName: string;
}

/** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
export type Base64URLString = string;

/** @format double */
export type COSEAlgorithmIdentifier = number;

export interface PublicKeyCredentialParameters {
  alg: COSEAlgorithmIdentifier;
  type: PublicKeyCredentialType;
}

/** https://w3c.github.io/webauthn/#dictdef-publickeycredentialdescriptorjson */
export interface PublicKeyCredentialDescriptorJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  id: Base64URLString;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransportFuture[];
}

export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment;
  requireResidentKey?: boolean;
  residentKey?: ResidentKeyRequirement;
  userVerification?: UserVerificationRequirement;
}

export interface AuthenticationExtensionsClientInputs {
  appid?: string;
  credProps?: boolean;
  hmacCreateSecret?: boolean;
  minPinLength?: boolean;
}

/**
 * A variant of PublicKeyCredentialCreationOptions suitable for JSON transmission to the browser to
 * (eventually) get passed into navigator.credentials.create(...) in the browser.
 *
 * This should eventually get replaced with official TypeScript DOM types when WebAuthn L3 types
 * eventually make it into the language:
 *
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson
 */
export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntity;
  /** https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentityjson */
  user: PublicKeyCredentialUserEntityJSON;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  challenge: Base64URLString;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  /** @format double */
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface IVerifyRegistrationResponseDto {
  verified: boolean;
}

/**
 * A slightly-modified AuthenticatorAttestationResponse to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-authenticatorattestationresponsejson
 */
export interface AuthenticatorAttestationResponseJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  clientDataJSON: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  attestationObject: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  authenticatorData?: Base64URLString;
  transports?: AuthenticatorTransportFuture[];
  publicKeyAlgorithm?: COSEAlgorithmIdentifier;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  publicKey?: Base64URLString;
}

export interface CredentialPropertiesOutput {
  rk?: boolean;
}

export interface AuthenticationExtensionsClientOutputs {
  appid?: boolean;
  credProps?: CredentialPropertiesOutput;
  hmacCreateSecret?: boolean;
}

/**
 * A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-registrationresponsejson
 */
export interface RegistrationResponseJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  id: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  rawId: Base64URLString;
  /**
   * A slightly-modified AuthenticatorAttestationResponse to simplify working with ArrayBuffers that
   * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
   *
   * https://w3c.github.io/webauthn/#dictdef-authenticatorattestationresponsejson
   */
  response: AuthenticatorAttestationResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: PublicKeyCredentialType;
}

export interface IVerifyRegistrationRequestDto {
  /**
   * A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
   * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
   *
   * https://w3c.github.io/webauthn/#dictdef-registrationresponsejson
   */
  data: RegistrationResponseJSON;
}

/**
 * A variant of PublicKeyCredentialRequestOptions suitable for JSON transmission to the browser to
 * (eventually) get passed into navigator.credentials.get(...) in the browser.
 */
export interface PublicKeyCredentialRequestOptionsJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  challenge: Base64URLString;
  /** @format double */
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJSON[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface IGenerateAuthenticationOptionsRequestDto {
  /** Email или телефон пользователя */
  login: string;
}

export interface IVerifyAuthenticationResponseDto {
  verified: boolean;
  tokens?: ITokensDto;
}

/**
 * A slightly-modified AuthenticatorAssertionResponse to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-authenticatorassertionresponsejson
 */
export interface AuthenticatorAssertionResponseJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  clientDataJSON: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  authenticatorData: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  signature: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  userHandle?: Base64URLString;
}

/**
 * A slightly-modified AuthenticationCredential to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-authenticationresponsejson
 */
export interface AuthenticationResponseJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  id: Base64URLString;
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  rawId: Base64URLString;
  /**
   * A slightly-modified AuthenticatorAssertionResponse to simplify working with ArrayBuffers that
   * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
   *
   * https://w3c.github.io/webauthn/#dictdef-authenticatorassertionresponsejson
   */
  response: AuthenticatorAssertionResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: PublicKeyCredentialType;
}

export interface IVerifyAuthenticationRequestDto {
  /**
   * A slightly-modified AuthenticationCredential to simplify working with ArrayBuffers that
   * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
   *
   * https://w3c.github.io/webauthn/#dictdef-authenticationresponsejson
   */
  data: AuthenticationResponseJSON;
}

export interface DeviceTokenDto {
  id: string;
  token: string;
  platform: EDevicePlatform;
  deviceName: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface IRegisterDeviceBody {
  token: string;
  platform: EDevicePlatform;
  deviceName?: string;
}

export interface NotificationSettingsDto {
  muteAll: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
}

export interface IUpdateNotificationSettingsBody {
  muteAll?: boolean;
  soundEnabled?: boolean;
  showPreview?: boolean;
}

export interface GetProfilesParams {
  /**
   * Смещение для пагинации
   * @format double
   */
  offset?: number;
  /**
   * Лимит количества возвращаемых профилей
   * @format double
   */
  limit?: number;
}

export interface GetProfileByIdParams {
  /** ID пользователя, профиль которого нужно получить */
  userId: string;
}

export interface UpdateProfileParams {
  /** ID пользователя, профиль которого необходимо обновить */
  userId: string;
}

export interface DeleteProfileParams {
  /** ID пользователя, профиль которого необходимо удалить */
  userId: string;
}

export interface SetRolePermissionsParams {
  /** ID роли */
  id: string;
}

export interface GetUsersParams {
  /**
   * Смещение для пагинации
   * @format double
   */
  offset?: number;
  /**
   * Лимит количества возвращаемых пользователей
   * @format double
   */
  limit?: number;
  /** Поиск по email */
  query?: string;
}

export interface GetUserOptionsParams {
  /** Поиск по email, имени или фамилии */
  query?: string;
}

export interface GetUserByIdParams {
  /** ID пользователя, которого нужно получить */
  id: string;
}

export interface SetPrivilegesParams {
  /** ID пользователя, для которого необходимо установить привилегии */
  id: string;
}

export interface VerifyEmailParams {
  /** Код подтверждения email, полученный пользователем */
  code: string;
}

export interface UpdateUserParams {
  /** ID пользователя, которого необходимо обновить */
  id: string;
}

export interface DeleteUserParams {
  /** ID пользователя, которого необходимо удалить */
  id: string;
}

/** Тело запроса с refresh токеном */
export interface RefreshPayload {
  refreshToken: string;
}

export interface DeleteDeviceParams {
  deviceId: string;
}

export interface GetUserChatsParams {
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
}

export interface GetChatByIdParams {
  id: string;
}

export interface UpdateChatParams {
  id: string;
}

export interface LeaveChatParams {
  id: string;
}

export interface AddMembersParams {
  id: string;
}

export interface RemoveMemberParams {
  id: string;
  userId: string;
}

export interface UpdateMemberRoleParams {
  id: string;
  userId: string;
}

export interface GetContactsParams {
  status?: EContactStatus;
}

export interface AcceptContactParams {
  id: string;
}

export interface RemoveContactParams {
  id: string;
}

export interface BlockContactParams {
  id: string;
}

export interface GetFileByIdParams {
  /** ID файла, который нужно получить */
  id: string;
}

export interface UploadFilePayload {
  /**
   * Файл, который нужно загрузить
   * @format binary
   */
  file: File;
}

export interface DeleteFileParams {
  /** ID файла, который нужно удалить */
  id: string;
}

export interface SendMessageParams {
  chatId: string;
}

export interface GetMessagesParams {
  /** ID сообщения для курсора (загрузить более старые) */
  before?: string;
  /**
   * Количество сообщений (по умолчанию 50)
   * @format double
   */
  limit?: number;
  /** ID чата */
  chatId: string;
}

export interface MarkAsReadParams {
  chatId: string;
}

export interface EditMessageParams {
  id: string;
}

export interface DeleteMessageParams {
  id: string;
}

export interface UnregisterDeviceParams {
  token: string;
}
