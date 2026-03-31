import type {
  ISocketCallHangupPayload,
  ISocketCallIceCandidatePayload,
  ISocketCallSignalPayload,
  MessengerSocketServerEvents,
} from "../events";
import { ISocketTransport } from "../transport";
import {
  type ICallSocketHandlers,
  type IChatSocketHandlers,
  IMessengerSocketService,
} from "./messengerSocket.types";

@IMessengerSocketService({ inSingleton: true })
export class MessengerSocketService implements IMessengerSocketService {
  constructor(@ISocketTransport() private _transport: ISocketTransport) {}

  // ── Chat Room ─────────────────────────────────────────────────────

  subscribeChat(chatId: string, handlers: IChatSocketHandlers): () => void {
    const disposers: Array<() => void> = [];

    this._transport.emit("chat:join", { chatId });

    const resubOnConnect = this._transport.onConnect(() => {
      this._transport.emit("chat:join", { chatId });
    });

    disposers.push(resubOnConnect);

    const bind = <K extends keyof MessengerSocketServerEvents>(
      event: K,
      handler: MessengerSocketServerEvents[K] | undefined,
    ) => {
      if (handler) {
        disposers.push(this._transport.on(event, handler));
      }
    };

    bind("message:new", handlers.onNewMessage);
    bind("message:updated", handlers.onMessageUpdated);
    bind("message:deleted", handlers.onMessageDeleted);
    bind("message:reaction", handlers.onMessageReaction);
    bind("message:pinned", handlers.onMessagePinned);
    bind("message:unpinned", handlers.onMessageUnpinned);
    bind("message:status", handlers.onMessageStatus);
    bind("chat:typing", handlers.onTyping);
    bind("chat:updated", handlers.onChatUpdated);
    bind("chat:member:joined", handlers.onMemberJoined);
    bind("chat:member:left", handlers.onMemberLeft);
    bind("chat:pinned", handlers.onChatPinned);
    bind("chat:slow-mode", handlers.onSlowMode);
    bind("chat:member:banned", handlers.onMemberBanned);
    bind("chat:member:unbanned", handlers.onMemberUnbanned);
    bind("poll:voted", handlers.onPollVoted);
    bind("poll:closed", handlers.onPollClosed);

    return () => {
      this._transport.emit("chat:leave", { chatId });
      disposers.forEach(d => d());
    };
  }

  sendTyping(chatId: string): void {
    this._transport.emit("chat:typing", { chatId });
  }

  markRead(chatId: string, messageId: string): void {
    this._transport.emit("message:read", { chatId, messageId });
  }

  markDelivered(chatId: string, messageIds: string[]): void {
    this._transport.emit("message:delivered", { chatId, messageIds });
  }

  // ── Profile ───────────────────────────────────────────────────────

  subscribeProfile(
    handler: MessengerSocketServerEvents["profile:updated"],
  ): () => void {
    this._transport.emit("profile:subscribe");

    const resubOnConnect = this._transport.onConnect(() => {
      this._transport.emit("profile:subscribe");
    });

    const off = this._transport.on("profile:updated", handler);

    return () => {
      resubOnConnect();
      off();
    };
  }

  emitProfileSubscribe(): void {
    this._transport.emit("profile:subscribe");
  }

  // ── Global Listeners ──────────────────────────────────────────────

  onNewMessage(
    handler: MessengerSocketServerEvents["message:new"],
  ): () => void {
    return this._transport.on("message:new", handler);
  }

  onChatCreated(
    handler: MessengerSocketServerEvents["chat:created"],
  ): () => void {
    return this._transport.on("chat:created", handler);
  }

  onChatUpdated(
    handler: MessengerSocketServerEvents["chat:updated"],
  ): () => void {
    return this._transport.on("chat:updated", handler);
  }

  onUnreadUpdate(
    handler: MessengerSocketServerEvents["chat:unread"],
  ): () => void {
    return this._transport.on("chat:unread", handler);
  }

  onChatLastMessage(
    handler: MessengerSocketServerEvents["chat:last-message"],
  ): () => void {
    return this._transport.on("chat:last-message", handler);
  }

  // ── Contacts ──────────────────────────────────────────────────────

  onContactRequest(
    handler: MessengerSocketServerEvents["contact:request"],
  ): () => void {
    return this._transport.on("contact:request", handler);
  }

  onContactAccepted(
    handler: MessengerSocketServerEvents["contact:accepted"],
  ): () => void {
    return this._transport.on("contact:accepted", handler);
  }

  // ── Calls ─────────────────────────────────────────────────────────

  onCallEvents(handlers: ICallSocketHandlers): () => void {
    const disposers: Array<() => void> = [];

    const bind = <K extends keyof MessengerSocketServerEvents>(
      event: K,
      handler: MessengerSocketServerEvents[K] | undefined,
    ) => {
      if (handler) {
        disposers.push(this._transport.on(event, handler));
      }
    };

    bind("call:incoming", handlers.onIncoming);
    bind("call:answered", handlers.onAnswered);
    bind("call:declined", handlers.onDeclined);
    bind("call:ended", handlers.onEnded);
    bind("call:missed", handlers.onMissed);
    bind("call:offer", handlers.onOffer);
    bind("call:answer", handlers.onAnswer);
    bind("call:ice-candidate", handlers.onIceCandidate);

    return () => disposers.forEach(d => d());
  }

  emitCallOffer(data: ISocketCallSignalPayload): void {
    this._transport.emit("call:offer", data);
  }

  emitCallAnswer(data: ISocketCallSignalPayload): void {
    this._transport.emit("call:answer", data);
  }

  emitIceCandidate(data: ISocketCallIceCandidatePayload): void {
    this._transport.emit("call:ice-candidate", data);
  }

  emitHangup(data: ISocketCallHangupPayload): void {
    this._transport.emit("call:hangup", data);
  }

  // ── Presence ──────────────────────────────────────────────────────

  onUserOnline(
    handler: MessengerSocketServerEvents["user:online"],
  ): () => void {
    return this._transport.on("user:online", handler);
  }

  onUserOffline(
    handler: MessengerSocketServerEvents["user:offline"],
  ): () => void {
    return this._transport.on("user:offline", handler);
  }

  onPresenceInit(
    handler: MessengerSocketServerEvents["presence:init"],
  ): () => void {
    return this._transport.on("presence:init", handler);
  }

  // ── Sync ──────────────────────────────────────────────────────────

  onSyncAvailable(
    handler: MessengerSocketServerEvents["sync:available"],
  ): () => void {
    return this._transport.on("sync:available", handler);
  }

  // ── Session ───────────────────────────────────────────────────────

  onSessionTerminated(
    handler: MessengerSocketServerEvents["session:terminated"],
  ): () => void {
    return this._transport.on("session:terminated", handler);
  }
}
