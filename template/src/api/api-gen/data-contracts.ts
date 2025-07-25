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

export enum ERole {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

export enum EPermissions {
  Read = "read",
  Write = "write",
  Delete = "delete",
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

export interface IUserDto {
  id: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  challenge?: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  role: IRoleDto;
}

export interface IUserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  challenge?: string;
}

export interface IUserListDto {
  /** @format double */
  count?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: IUserDto[];
}

export interface IUserPrivilegesRequest {
  roleName: ERole;
  permissions: EPermissions[];
}

export interface ApiResponse {
  message?: string;
  data?: any;
}

export interface IUserPassword {
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
  challenge?: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  role: IRoleDto;
  tokens: ITokensDto;
}

export type TSignUpRequest = {
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

export interface ISignInRequest {
  /** Может быть телефоном, email-ом и username-ом */
  login: string;
  password: string;
}

export interface IUserLogin {
  /** Может быть телефоном, email-ом и username-ом */
  login: string;
}

export interface IUserResetPasswordRequest {
  password: string;
  token: string;
}

export interface IRegisterBiometricResponse {
  registered: boolean;
}

export interface IRegisterBiometricRequest {
  userId: string;
  deviceId: string;
  deviceName: string;
  publicKey: string;
}

export interface IGenerateNonceResponse {
  nonce: string;
}

export interface IGenerateNonceRequest {
  userId: string;
}

export interface IVerifyBiometricSignatureResponse {
  verified: boolean;
  tokens: {
    refreshToken: string;
    accessToken: string;
  };
}

export interface IVerifyBiometricSignatureRequest {
  userId: string;
  deviceId: string;
  signature: string;
}

export interface FCMMessage {
  dialogId?: string;
  link?: string;
  to: string;
  message: {
    sound?: string;
    image?: string;
    description?: string;
    title: string;
  };
  /** @format double */
  badge?: number;
  type?: "token" | "topic";
  data?: Record<string, string>;
}

export interface FcmTokenDto {
  /** @format double */
  id: number;
  userId: string;
  token: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface FcmTokenRequest {
  token: string;
}

export interface DialogMembersDto {
  id: string;
  userId: string;
  dialogId: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  user: IUserDto;
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

export interface IDialogMessagesDto {
  id: string;
  userId: string;
  dialogId: string;
  text: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  replyId?: string | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  user: IUserDto;
  images?: IFileDto[];
  videos?: IFileDto[];
  audios?: IFileDto[];
  reply?: IDialogMessagesDto;
}

export interface DialogDto {
  id: string;
  ownerId: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  owner: IUserDto;
  members: DialogMembersDto[];
  lastMessage: IDialogMessagesDto[] | null;
  /** @format double */
  unreadMessagesCount: number;
}

export interface IDialogListDto {
  /** @format double */
  count?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: DialogDto[];
}

export interface DialogFindRequest {
  recipientId: string[];
}

export interface DialogCreateRequest {
  recipientId: string[];
}

export interface DialogMembersAddRequest {
  dialogId: string;
  members: string[];
}

export interface IDialogListMessagesDto {
  /** @format double */
  count?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: IDialogMessagesDto[];
}

export interface IMessagesRequest {
  dialogId: string;
  text: string;
  system?: boolean;
  received?: boolean;
  replyId?: string | null;
  imageIds?: string[];
  videoIds?: string[];
  audioIds?: string[];
}

export interface IMessagesUpdateRequest {
  text?: string;
  system?: boolean;
  received?: boolean;
  replyId?: string | null;
  imageIds?: string[];
  videoIds?: string[];
  audioIds?: string[];
  deleteFileIds?: string[];
}

/** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
export type Base64URLString = string;

export enum PublicKeyCredentialType {
  PublicKey = "public-key",
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

/** https://w3c.github.io/webauthn/#dictdef-publickeycredentialdescriptorjson */
export interface PublicKeyCredentialDescriptorJSON {
  /** An attempt to communicate that this isn't just any string, but a Base64URL-encoded string */
  id: Base64URLString;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransportFuture[];
}

export enum UserVerificationRequirement {
  Discouraged = "discouraged",
  Preferred = "preferred",
  Required = "required",
}

export interface AuthenticationExtensionsClientInputs {
  appid?: string;
  credProps?: boolean;
  hmacCreateSecret?: boolean;
  minPinLength?: boolean;
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

/** @format double */
export type COSEAlgorithmIdentifier = number;

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

export enum AuthenticatorAttachment {
  CrossPlatform = "cross-platform",
  Platform = "platform",
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

export interface IVerifyRegistrationRequest {
  userId: string;
  /**
   * A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
   * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
   *
   * https://w3c.github.io/webauthn/#dictdef-registrationresponsejson
   */
  data: RegistrationResponseJSON;
}

export interface IVerifyAuthenticationResponse {
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

export interface IVerifyAuthenticationRequest {
  userId: string;
  /**
   * A slightly-modified AuthenticationCredential to simplify working with ArrayBuffers that
   * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
   *
   * https://w3c.github.io/webauthn/#dictdef-authenticationresponsejson
   */
  data: AuthenticationResponseJSON;
}

export interface IProfileDto {
  id: string;
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
  avatar: IFileDto | null;
}

export interface IProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  /** @format date-time */
  birthDate?: string;
  gender?: string;
  status?: string;
}

export interface IProfileListDto {
  /** @format double */
  count?: number;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  data: IProfileDto[];
}

export interface GetUsersParams {
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

/** Тело запроса с refresh токеном */
export interface RefreshPayload {
  refreshToken: string;
}

/** Объект, содержащий APN-токены, название приложения и флаг песочницы. */
export interface RegisterApnPayload {
  sandbox: boolean;
  application: string;
  apns_tokens: string[];
}

export interface GetTokensParams {
  /** ID профиля пользователя. */
  userId: string;
}

export interface GetUnreadMessagesCountParams {
  /** ID диалога (необязательно, если указано, то считает непрочитанные в конкретном диалоге). */
  dialogId?: string;
}

export interface GetDialogsParams {
  /**
   * Смещение (пагинация).
   * @format double
   */
  offset?: number;
  /**
   * Количество элементов (пагинация).
   * @format double
   */
  limit?: number;
}

export interface GetMembersParams {
  /** ID диалога. */
  dialogId: string;
}

export interface GetMessagesParams {
  /** ID диалога. */
  dialogId: string;
  /**
   * Смещение.
   * @format double
   */
  offset?: number;
  /**
   * Количество сообщений.
   * @format double
   */
  limit?: number;
}

export interface GetLastMessageParams {
  /** ID диалога. */
  dialogId: string;
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

export interface GenerateRegistrationOptionsPayload {
  userId: string;
}

export interface GenerateAuthenticationOptionsPayload {
  userId: string;
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

export interface AddAvatarPayload {
  /**
   * Файл изображения аватара
   * @format binary
   */
  file: File;
}
