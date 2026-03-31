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

export enum ESyncAction {
  Create = "create",
  Update = "update",
  Delete = "delete",
}

export enum ESyncEntityType {
  Message = "message",
  Chat = "chat",
  ChatMember = "chat_member",
  Contact = "contact",
  Profile = "profile",
}

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

export enum EContactStatus {
  Pending = "pending",
  Accepted = "accepted",
  Blocked = "blocked",
}

export enum EChatMemberRole {
  Owner = "owner",
  Admin = "admin",
  Member = "member",
  Subscriber = "subscriber",
}

export enum EChatType {
  Direct = "direct",
  Group = "group",
  Channel = "channel",
}

export enum ECallStatus {
  Ringing = "ringing",
  Active = "active",
  Ended = "ended",
  Missed = "missed",
  Declined = "declined",
}

export enum ECallType {
  Voice = "voice",
  Video = "video",
}

export enum EMessageStatus {
  Sent = "sent",
  Delivered = "delivered",
  Read = "read",
}

export enum EMessageType {
  Text = "text",
  Image = "image",
  File = "file",
  Voice = "voice",
  System = "system",
  Poll = "poll",
}

export enum EPrivacyLevel {
  Everyone = "everyone",
  Contacts = "contacts",
  Nobody = "nobody",
}

/** Тип для предопределённых permissions (автодополнение в IDE). */
export enum KnownPermission {
  Value = "*",
  UserView = "user:view",
  UserManage = "user:manage",
  RoleView = "role:view",
  RoleManage = "role:manage",
  ProfileView = "profile:view",
  ProfileManage = "profile:manage",
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

/** Тип для предопределённых ролей (автодополнение в IDE). */
export enum KnownRole {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

export interface SessionDto {
  id: string;
  userId: string;
  deviceName: string | null;
  deviceType: string | null;
  ip: string | null;
  userAgent: string | null;
  /** @format date-time */
  lastActiveAt: string;
  /** @format date-time */
  createdAt: string;
}

export interface IFileDto {
  id: string;
  name: string;
  type: string;
  url: string;
  /** @format double */
  size: number;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  blurhash: string | null;
  /** @format double */
  width: number | null;
  /** @format double */
  height: number | null;
  /** @format double */
  duration: number | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface ProfileDto {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  /** @format date-time */
  birthDate: string | null;
  gender: string | null;
  /** @format date-time */
  lastOnline: string | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  avatar?: IFileDto;
  user?: UserDto;
}

/** Роль — произвольная строка; предопределённые значения дают автодополнение. */
export type TRole = KnownRole | (string & object);

/** Permission — произвольная строка; предопределённые значения дают автодополнение. */
export type TPermission = KnownPermission | (string & object);

export interface IPermissionDto {
  id: string;
  /** Permission — произвольная строка; предопределённые значения дают автодополнение. */
  name: TPermission;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface IRoleDto {
  id: string;
  /** Роль — произвольная строка; предопределённые значения дают автодополнение. */
  name: TRole;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  permissions: IPermissionDto[];
}

export interface UserDto {
  id: string;
  email: string | null;
  emailVerified?: boolean;
  phone: string | null;
  username: string | null;
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
  /** @format date-time */
  birthDate?: string;
  gender?: string;
}

export interface PrivacySettingsDto {
  showLastOnline: EPrivacyLevel;
  showPhone: EPrivacyLevel;
  showAvatar: EPrivacyLevel;
}

export interface PublicProfileDto {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  /** @format date-time */
  lastOnline: string | null;
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

export interface ICreateRoleRequestDto {
  /** Роль — произвольная строка; предопределённые значения дают автодополнение. */
  name: TRole;
}

export interface IRolePermissionsRequestDto {
  permissions: TPermission[];
}

export interface IUserUpdateRequestDto {
  email?: string;
  phone?: string;
  roleId?: string;
}

export interface PublicUserDto {
  userId: string;
  email: string | null;
  username: string | null;
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
  name: string | null;
}

export interface IUserOptionsDto {
  data: IUserOptionDto[];
}

export interface IUserPrivilegesRequestDto {
  /** Роли для назначения пользователю (заменяет текущие роли). */
  roles: TRole[];
  /**
   * Прямые разрешения, выданные этому пользователю дополнительно к разрешениям ролей.
   * Заменяет текущие прямые разрешения.
   */
  permissions: TPermission[];
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
  email: string | null;
  emailVerified?: boolean;
  phone: string | null;
  username: string | null;
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

export interface I2FARequiredDto {
  require2FA: true;
  twoFactorToken: string;
  twoFactorHint?: string;
}

export type ISignInResponseDto = IUserWithTokensDto | I2FARequiredDto;

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

export interface IEnable2FARequestDto {
  password: string;
  hint?: string;
}

export interface IDisable2FARequestDto {
  password: string;
}

export interface IVerify2FARequestDto {
  twoFactorToken: string;
  password: string;
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
  deviceName: string | null;
  /** @format date-time */
  lastUsedAt: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface IBiometricDevicesResponseDto {
  devices: IBiometricDeviceDto[];
}

export interface IDeleteBiometricResponseDto {
  deleted: boolean;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string | null;
  type: EMessageType;
  status: EMessageStatus;
  content: string | null;
  replyToId: string | null;
  forwardedFromId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  /** @format date-time */
  pinnedAt: string | null;
  pinnedById: string | null;
  keyboard: any;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  sender?: {
    avatarUrl?: string | null;
    lastName?: string | null;
    firstName?: string | null;
    id: string;
  };
  replyTo?: MessageDto | null;
  attachments: MessageAttachmentDto[];
  reactions: {
    userIds: string[];
    /** @format double */
    count: number;
    emoji: string;
  }[];
  mentions: {
    isAll: boolean;
    userId: string | null;
  }[];
  poll?: PollDto | null;
}

export interface MessageAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  /** @format double */
  fileSize: number;
  thumbnailUrl: string | null;
  /** @format double */
  width: number | null;
  /** @format double */
  height: number | null;
  /** @format double */
  duration: number | null;
}

export interface PollOptionDto {
  id: string;
  text: string;
  /** @format double */
  position: number;
  /** @format double */
  voterCount: number;
  voterIds: string[];
}

export interface PollDto {
  id: string;
  messageId: string;
  question: string;
  isAnonymous: boolean;
  isMultipleChoice: boolean;
  isClosed: boolean;
  /** @format date-time */
  closedAt: string | null;
  options: PollOptionDto[];
  /** @format double */
  totalVotes: number;
  userVotedOptionIds: string[];
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface IBotSendMessageBody {
  chatId: string;
  content?: string;
  type?: EMessageType;
  replyToId?: string;
  fileIds?: string[];
}

export interface IBotEditMessageBody {
  content: string;
}

export interface BotCommandDto {
  command: string;
  description: string;
}

export interface BotDetailDto {
  id: string;
  username: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  /** @format date-time */
  createdAt: string;
  token: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
  webhookEvents: string[];
  commands: BotCommandDto[];
}

export interface ICreateBotBody {
  username: string;
  displayName: string;
  description?: string;
}

export interface BotDto {
  id: string;
  username: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  /** @format date-time */
  createdAt: string;
}

export interface IUpdateBotBody {
  displayName?: string;
  description?: string | null;
  avatarId?: string | null;
}

export interface ISetWebhookBody {
  url: string;
  secret?: string;
}

export interface ISetCommandsBody {
  commands: {
    description: string;
    command: string;
  }[];
}

export interface IWebhookTestResponse {
  success: boolean;
  /** @format double */
  statusCode: number | null;
  errorMessage: string | null;
  /** @format double */
  durationMs: number;
}

/** Construct a type with a set of properties K of type T */
export type RecordStringUnknown = object;

export interface WebhookLogDto {
  id: string;
  eventType: string;
  payload: RecordStringUnknown | null;
  /** @format double */
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  /** @format double */
  attempts: number;
  /** @format double */
  durationMs: number | null;
  /** @format date-time */
  createdAt: string;
}

export interface IWebhookLogsResponse {
  data: WebhookLogDto[];
  /** @format double */
  totalCount: number;
}

export interface ISetWebhookEventsBody {
  events: string[];
}

export interface CallDto {
  id: string;
  callerId: string;
  calleeId: string;
  chatId: string | null;
  type: ECallType;
  status: ECallStatus;
  /** @format date-time */
  startedAt: string | null;
  /** @format date-time */
  endedAt: string | null;
  /** @format double */
  duration: number | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  caller?: {
    avatarUrl?: string | null;
    lastName?: string | null;
    firstName?: string | null;
    id: string;
  };
  callee?: {
    avatarUrl?: string | null;
    lastName?: string | null;
    firstName?: string | null;
    id: string;
  };
}

export interface IInitiateCallBody {
  calleeId: string;
  chatId?: string;
  type?: ECallType;
}

export interface ICallHistoryDto {
  data: CallDto[];
  /** @format double */
  totalCount: number;
}

export interface ISetSlowModeBody {
  /** @format double */
  seconds: number;
}

export interface IBanMemberBody {
  /** @format double */
  duration?: number;
  reason?: string;
}

export interface IBannedMemberDto {
  userId: string;
  chatId: string;
  reason?: string;
  /** @format date-time */
  bannedAt: string;
  /** @format date-time */
  expiresAt?: string;
}

export interface ChatLastMessageDto {
  id: string;
  content: string | null;
  type: EMessageType;
  senderId: string | null;
  senderName: string | null;
  /** @format date-time */
  createdAt: string;
}

export interface ChatMemberDto {
  id: string;
  userId: string;
  role: EChatMemberRole;
  /** @format date-time */
  joinedAt: string;
  /** @format date-time */
  mutedUntil: string | null;
  lastReadMessageId: string | null;
  isPinnedChat: boolean;
  /** @format date-time */
  pinnedChatAt: string | null;
  folderId: string | null;
  profile?: PublicProfileDto;
}

/** Публичные данные собеседника в direct-чате (без приватных настроек членства). */
export interface ChatPeerDto {
  userId: string;
  role: EChatMemberRole;
  profile?: PublicProfileDto;
}

export interface ChatDto {
  id: string;
  type: EChatType;
  name: string | null;
  description: string | null;
  username: string | null;
  isPublic: boolean;
  avatarUrl: string | null;
  createdById: string | null;
  /** @format double */
  slowModeSeconds: number;
  /** @format date-time */
  lastMessageAt: string | null;
  lastMessage: ChatLastMessageDto | null;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  members: ChatMemberDto[];
  /** Членство текущего пользователя в чате */
  me: ChatMemberDto | null;
  /** Собеседник в direct-чате (null для групп/каналов) */
  peer: ChatPeerDto | null;
}

export interface ICreateDirectChatBody {
  targetUserId: string;
}

export interface ICreateGroupChatBody {
  name: string;
  memberIds: string[];
  avatarId?: string;
}

export interface ICreateChannelBody {
  name: string;
  description?: string;
  username?: string;
  avatarId?: string;
  isPublic?: boolean;
}

export interface IUpdateChannelBody {
  name?: string;
  description?: string | null;
  username?: string | null;
  avatarId?: string | null;
  isPublic?: boolean;
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

export interface ChatInviteDto {
  id: string;
  chatId: string;
  code: string;
  createdById: string;
  /** @format date-time */
  expiresAt: string | null;
  /** @format double */
  maxUses: number | null;
  /** @format double */
  useCount: number;
  isActive: boolean;
  /** @format date-time */
  createdAt: string;
}

export interface ICreateInviteBody {
  expiresAt?: string;
  /** @format double */
  maxUses?: number;
}

export interface IMuteChatBody {
  mutedUntil: string | null;
}

export interface IAddMembersBody {
  memberIds: string[];
}

export interface IUpdateMemberRoleBody {
  role: EChatMemberRole;
}

export interface IMoveChatToFolderBody {
  folderId: string | null;
}

export interface ChatFolderDto {
  id: string;
  userId: string;
  name: string;
  /** @format double */
  position: number;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface ICreateFolderBody {
  name: string;
}

export interface IUpdateFolderBody {
  name?: string;
  /** @format double */
  position?: number;
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

export interface ISendMessageBody {
  type?: EMessageType;
  content?: string;
  replyToId?: string;
  forwardedFromId?: string;
  fileIds?: string[];
  mentionedUserIds?: string[];
  mentionAll?: boolean;
}

export interface IMessageListDto {
  data: MessageDto[];
  hasMore: boolean;
  /** Present when using `around` — indicates newer messages exist above the window. */
  hasNewer?: boolean;
}

export interface IMessageSearchDto {
  data: MessageDto[];
  /** @format double */
  totalCount: number;
}

export interface MediaItemDto {
  id: string;
  messageId: string;
  chatId: string;
  senderId: string | null;
  attachments: MessageAttachmentDto[];
  /** @format date-time */
  createdAt: string;
  sender?: {
    avatarUrl?: string | null;
    lastName?: string | null;
    firstName?: string | null;
    id: string;
  };
}

export interface IMediaGalleryDto {
  data: MediaItemDto[];
  /** @format double */
  totalCount: number;
}

export interface IMediaStatsDto {
  /** @format double */
  images: number;
  /** @format double */
  videos: number;
  /** @format double */
  audio: number;
  /** @format double */
  documents: number;
  /** @format double */
  total: number;
}

export interface IMarkReadBody {
  messageId: string;
}

export interface IEditMessageBody {
  content: string;
}

export interface IAddReactionBody {
  emoji: string;
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

export interface ICreatePollBody {
  question: string;
  options: string[];
  isAnonymous?: boolean;
  isMultipleChoice?: boolean;
}

export interface IVotePollBody {
  optionIds: string[];
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

export interface SyncLogDto {
  version: string;
  entityType: ESyncEntityType;
  entityId: string;
  action: ESyncAction;
  chatId: string | null;
  payload: RecordStringUnknown | null;
  /** @format date-time */
  createdAt: string;
}

export interface ISyncResponseDto {
  changes: SyncLogDto[];
  currentVersion: string;
  hasMore: boolean;
}

export interface TerminateSessionParams {
  id: string;
}

export interface UpdatePrivacySettingsPayload {
  showAvatar?: EPrivacyLevel;
  showPhone?: EPrivacyLevel;
  showLastOnline?: EPrivacyLevel;
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

export interface DeleteRoleParams {
  /** ID роли */
  id: string;
}

export interface SetRolePermissionsParams {
  /** ID роли */
  id: string;
}

export interface SetUsernamePayload {
  username: string;
}

export interface SearchUsersParams {
  q: string;
  /** @format double */
  limit?: number;
  /** @format double */
  offset?: number;
}

export interface GetUserByUsernameParams {
  username: string;
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

export interface BotEditMessageParams {
  id: string;
}

export interface BotDeleteMessageParams {
  id: string;
}

export interface GetBotByIdParams {
  id: string;
}

export interface UpdateBotParams {
  id: string;
}

export interface DeleteBotParams {
  id: string;
}

export interface RegenerateTokenParams {
  id: string;
}

export interface SetWebhookParams {
  id: string;
}

export interface DeleteWebhookParams {
  id: string;
}

export interface SetCommandsParams {
  id: string;
}

export interface GetCommandsParams {
  id: string;
}

export interface TestWebhookParams {
  id: string;
}

export interface GetWebhookLogsParams {
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
  id: string;
}

export interface SetWebhookEventsParams {
  id: string;
}

export interface AnswerCallParams {
  id: string;
}

export interface DeclineCallParams {
  id: string;
}

export interface EndCallParams {
  id: string;
}

export interface GetCallHistoryParams {
  /** @format double */
  limit?: number;
  /** @format double */
  offset?: number;
}

export interface SetSlowModeParams {
  id: string;
}

export interface BanMemberParams {
  id: string;
  userId: string;
}

export interface UnbanMemberParams {
  id: string;
  userId: string;
}

export interface GetBannedMembersParams {
  id: string;
}

export interface UpdateChannelParams {
  id: string;
}

export interface SubscribeToChannelParams {
  id: string;
}

export interface UnsubscribeFromChannelParams {
  id: string;
}

export interface SearchChannelsParams {
  q?: string;
  /** @format double */
  offset?: number;
  /** @format double */
  limit?: number;
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

export interface CreateInviteLinkParams {
  id: string;
}

export interface GetInvitesParams {
  id: string;
}

export interface RevokeInviteParams {
  id: string;
  inviteId: string;
}

export interface JoinByInviteParams {
  code: string;
}

export interface MuteChatParams {
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

export interface PinChatParams {
  id: string;
}

export interface UnpinChatParams {
  id: string;
}

export interface MoveChatToFolderParams {
  id: string;
}

export interface UpdateFolderParams {
  folderId: string;
}

export interface DeleteFolderParams {
  folderId: string;
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
  /** ID сообщения — загрузить более старые */
  before?: string;
  /** ID сообщения — загрузить более новые */
  after?: string;
  /** ID сообщения — загрузить окно вокруг него */
  around?: string;
  /**
   * Количество сообщений (по умолчанию 50)
   * @format double
   */
  limit?: number;
  /** ID чата */
  chatId: string;
}

export interface SearchMessagesParams {
  q: string;
  /** @format double */
  limit?: number;
  /** @format double */
  offset?: number;
  chatId: string;
}

export interface GetPinnedMessagesParams {
  chatId: string;
}

export interface GetChatMediaParams {
  /** Фильтр по MIME-префиксу (image, video, audio) */
  type?: string;
  /**
   * Количество (по умолчанию 50)
   * @format double
   */
  limit?: number;
  /**
   * Смещение
   * @format double
   */
  offset?: number;
  /** ID чата */
  chatId: string;
}

export interface GetChatMediaStatsParams {
  chatId: string;
}

export interface MarkAsReadParams {
  chatId: string;
}

export interface SearchMessages2Params {
  q: string;
  /** @format double */
  limit?: number;
  /** @format double */
  offset?: number;
}

export interface EditMessageParams {
  id: string;
}

export interface DeleteMessageParams {
  id: string;
}

export interface AddReactionParams {
  id: string;
}

export interface RemoveReactionParams {
  id: string;
}

export interface PinMessageParams {
  id: string;
}

export interface UnpinMessageParams {
  id: string;
}

export interface CreatePollParams {
  chatId: string;
}

export interface VoteParams {
  id: string;
}

export interface RetractVoteParams {
  id: string;
}

export interface ClosePollParams {
  id: string;
}

export interface GetPollParams {
  id: string;
}

export interface UnregisterDeviceParams {
  token: string;
}

export interface GetChangesParams {
  sinceVersion?: string;
  /** @format double */
  limit?: number;
}
