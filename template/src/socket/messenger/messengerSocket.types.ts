import { createServiceDecorator } from "@di";

import type {
  ISocketCallHangupPayload,
  ISocketCallIceCandidatePayload,
  ISocketCallSignalPayload,
  MessengerSocketClientEvents,
  MessengerSocketServerEvents,
} from "../events";

export type ServerEvent = keyof MessengerSocketServerEvents;
export type ClientEvent = keyof MessengerSocketClientEvents;

export interface IChatSocketHandlers {
  onNewMessage?: MessengerSocketServerEvents["message:new"];
  onMessageUpdated?: MessengerSocketServerEvents["message:updated"];
  onMessageDeleted?: MessengerSocketServerEvents["message:deleted"];
  onMessageReaction?: MessengerSocketServerEvents["message:reaction"];
  onMessagePinned?: MessengerSocketServerEvents["message:pinned"];
  onMessageUnpinned?: MessengerSocketServerEvents["message:unpinned"];
  onMessageStatus?: MessengerSocketServerEvents["message:status"];
  onTyping?: MessengerSocketServerEvents["chat:typing"];
  onChatUpdated?: MessengerSocketServerEvents["chat:updated"];
  onMemberJoined?: MessengerSocketServerEvents["chat:member:joined"];
  onMemberLeft?: MessengerSocketServerEvents["chat:member:left"];
  onChatPinned?: MessengerSocketServerEvents["chat:pinned"];
  onSlowMode?: MessengerSocketServerEvents["chat:slow-mode"];
  onMemberBanned?: MessengerSocketServerEvents["chat:member:banned"];
  onMemberUnbanned?: MessengerSocketServerEvents["chat:member:unbanned"];
  onPollVoted?: MessengerSocketServerEvents["poll:voted"];
  onPollClosed?: MessengerSocketServerEvents["poll:closed"];
}

export interface ICallSocketHandlers {
  onIncoming?: MessengerSocketServerEvents["call:incoming"];
  onAnswered?: MessengerSocketServerEvents["call:answered"];
  onDeclined?: MessengerSocketServerEvents["call:declined"];
  onEnded?: MessengerSocketServerEvents["call:ended"];
  onMissed?: MessengerSocketServerEvents["call:missed"];
  onOffer?: MessengerSocketServerEvents["call:offer"];
  onAnswer?: MessengerSocketServerEvents["call:answer"];
  onIceCandidate?: MessengerSocketServerEvents["call:ice-candidate"];
}

export interface IMessengerSocketService {
  /** Subscribe to a chat room and listen for events. Returns unsubscribe fn. */
  subscribeChat(chatId: string, handlers: IChatSocketHandlers): () => void;

  /** Send typing indicator */
  sendTyping(chatId: string): void;

  /** Mark message as read */
  markRead(chatId: string, messageId: string): void;

  /** Mark messages as delivered */
  markDelivered(chatId: string, messageIds: string[]): void;

  /** Subscribe to profile updates */
  subscribeProfile(
    handler: MessengerSocketServerEvents["profile:updated"],
  ): () => void;

  /** Listen for new messages globally (for chat list updates) */
  onNewMessage(handler: MessengerSocketServerEvents["message:new"]): () => void;

  /** Listen for chat created/updated globally */
  onChatCreated(
    handler: MessengerSocketServerEvents["chat:created"],
  ): () => void;
  onChatUpdated(
    handler: MessengerSocketServerEvents["chat:updated"],
  ): () => void;

  /** Listen for unread count updates */
  onUnreadUpdate(
    handler: MessengerSocketServerEvents["chat:unread"],
  ): () => void;

  /** Listen for chat last message updates */
  onChatLastMessage(
    handler: MessengerSocketServerEvents["chat:last-message"],
  ): () => void;

  /** Listen for contact events */
  onContactRequest(
    handler: MessengerSocketServerEvents["contact:request"],
  ): () => void;
  onContactAccepted(
    handler: MessengerSocketServerEvents["contact:accepted"],
  ): () => void;

  /** Listen for call events globally */
  onCallEvents(handlers: ICallSocketHandlers): () => void;

  /** Listen for user online presence */
  onUserOnline(handler: MessengerSocketServerEvents["user:online"]): () => void;
  /** Listen for user offline presence */
  onUserOffline(
    handler: MessengerSocketServerEvents["user:offline"],
  ): () => void;
  /** Listen for initial presence list on connect */
  onPresenceInit(
    handler: MessengerSocketServerEvents["presence:init"],
  ): () => void;

  /** Listen for sync available */
  onSyncAvailable(
    handler: MessengerSocketServerEvents["sync:available"],
  ): () => void;

  /** Listen for session terminated */
  onSessionTerminated(
    handler: MessengerSocketServerEvents["session:terminated"],
  ): () => void;

  /** Listen for new session */
  onSessionNew(handler: MessengerSocketServerEvents["session:new"]): () => void;

  /** Listen for contact removed */
  onContactRemoved(
    handler: MessengerSocketServerEvents["contact:removed"],
  ): () => void;

  /** Listen for contact blocked */
  onContactBlocked(
    handler: MessengerSocketServerEvents["contact:blocked"],
  ): () => void;

  /** Listen for contact unblocked */
  onContactUnblocked(
    handler: MessengerSocketServerEvents["contact:unblocked"],
  ): () => void;

  /** Listen for email verified */
  onEmailVerified(
    handler: MessengerSocketServerEvents["user:email-verified"],
  ): () => void;

  /** Listen for password changed */
  onPasswordChanged(
    handler: MessengerSocketServerEvents["user:password-changed"],
  ): () => void;

  /** Listen for privileges changed */
  onPrivilegesChanged(
    handler: MessengerSocketServerEvents["user:privileges-changed"],
  ): () => void;

  /** Listen for username changed */
  onUsernameChanged(
    handler: MessengerSocketServerEvents["user:username-changed"],
  ): () => void;

  /** Listen for 2FA status change */
  on2faChanged(
    handler: MessengerSocketServerEvents["auth:2fa-changed"],
  ): () => void;

  /** Listen for privacy settings changed */
  onPrivacyChanged(
    handler: MessengerSocketServerEvents["profile:privacy-changed"],
  ): () => void;

  /** Listen for push settings changed */
  onPushSettingsChanged(
    handler: MessengerSocketServerEvents["push:settings-changed"],
  ): () => void;

  /** Listen for chat pinned */
  onChatPinned(handler: MessengerSocketServerEvents["chat:pinned"]): () => void;

  /** Emit profile subscribe */
  emitProfileSubscribe(): void;

  /** WebRTC signaling */
  emitCallOffer(data: ISocketCallSignalPayload): void;
  emitCallAnswer(data: ISocketCallSignalPayload): void;
  emitIceCandidate(data: ISocketCallIceCandidatePayload): void;
  emitHangup(data: ISocketCallHangupPayload): void;
}

export const IMessengerSocketService =
  createServiceDecorator<IMessengerSocketService>();
