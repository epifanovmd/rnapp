import { IMessengerSocketService, ISocketTransport } from "@socket";
import { disposer, InitializeDispose } from "@utils";
import { makeAutoObservable, reaction } from "mobx";

import { IAuthStore } from "../auth";
import { ICallStore } from "../calls";
import { IChatStore } from "../chat";
import { IChatListStore } from "../chatList";
import { IContactStore } from "../contacts";
import { INotificationSettingsStore } from "../notifications";
import { IPresenceStore } from "../presence";
import { IProfileStore } from "../profile";
import { ISessionStore } from "../sessions";
import { ISyncStore } from "../sync";
import { IAppDataStore } from "./AppData.types";

@IAppDataStore({ inSingleton: true })
export class AppDataStore implements IAppDataStore {
  constructor(
    @IAuthStore() private _authStore: IAuthStore,
    @ISocketTransport() private _socketTransport: ISocketTransport,
    @IMessengerSocketService()
    private _messengerSocket: IMessengerSocketService,
    @ICallStore() private _callStore: ICallStore,
    @IChatStore() private _chatStore: IChatStore,
    @ISessionStore() private _sessionStore: ISessionStore,
    @ISyncStore() private _syncStore: ISyncStore,
    @IChatListStore() private _chatListStore: IChatListStore,
    @IContactStore() private _contactStore: IContactStore,
    @IProfileStore() private _profileStore: IProfileStore,
    @IPresenceStore() private _presenceStore: IPresenceStore,
    @INotificationSettingsStore()
    private _notificationSettingsStore: INotificationSettingsStore,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    const socketDisposers = new Set<InitializeDispose>();
    const globalDisposers: Array<() => void> = [];

    return [
      reaction(
        () => this._authStore.isAuthenticated,
        isAuthenticated => {
          if (isAuthenticated) {
            socketDisposers.add(this._socketTransport.initialize());

            globalDisposers.push(this._setupGlobalSocketListeners());

            this._syncStore.sync().catch(() => {});
            this._callStore.loadActiveCall().catch(() => {});
          } else {
            disposer(Array.from(socketDisposers));
            socketDisposers.clear();

            globalDisposers.forEach(d => d());
            globalDisposers.length = 0;

            this._presenceStore.clear();
          }
        },
      ),
      () => {
        disposer(Array.from(socketDisposers));
        socketDisposers.clear();
        globalDisposers.forEach(d => d());
        globalDisposers.length = 0;
      },
    ];
  }

  private _setupGlobalSocketListeners(): () => void {
    const disposers: Array<() => void> = [];

    disposers.push(
      ...this._setupSyncListeners(),
      ...this._setupProfileListeners(),
      ...this._setupChatListeners(),
      ...this._setupContactListeners(),
      ...this._setupCallListeners(),
      ...this._setupPresenceListeners(),
      ...this._setupSessionListeners(),
      ...this._setupUserListeners(),
      ...this._setupAuthListeners(),
      ...this._setupPushListeners(),
    );

    return () => disposers.forEach(d => d());
  }

  // ── Sync ────────────────────────────────────────────────────────────

  private _setupSyncListeners(): Array<() => void> {
    let wasDisconnected = false;

    return [
      this._socketTransport.onDisconnect(() => {
        wasDisconnected = true;
      }),
      this._socketTransport.onConnect(() => {
        if (wasDisconnected) {
          this._syncStore.sync().catch(() => {});
          wasDisconnected = false;
        }
      }),
      this._messengerSocket.onSyncAvailable(({ version }) => {
        this._syncStore.handleSyncAvailable(version);
      }),
    ];
  }

  // ── Profile ─────────────────────────────────────────────────────────

  private _setupProfileListeners(): Array<() => void> {
    return [
      this._messengerSocket.subscribeProfile(profile => {
        this._profileStore.handleProfileUpdated(profile);
        this._contactStore.handleProfileUpdated(profile);
        this._chatListStore.handleProfileUpdated(profile);
        this._chatStore.handleProfileUpdated(profile);
      }),
    ];
  }

  // ── Chat ────────────────────────────────────────────────────────────

  private _setupChatListeners(): Array<() => void> {
    return [
      this._messengerSocket.onNewMessage(message => {
        this._chatListStore.handleNewMessage(message);
      }),
      this._messengerSocket.onChatCreated(chat => {
        this._chatListStore.handleChatCreated(chat);
      }),
      this._messengerSocket.onChatUpdated(chat => {
        this._chatListStore.handleChatUpdated(chat);
      }),
      this._messengerSocket.onUnreadUpdate(({ chatId, unreadCount }) => {
        this._chatListStore.handleUnreadUpdate(chatId, unreadCount);
      }),
      this._messengerSocket.onChatLastMessage(({ chatId, lastMessage }) => {
        this._chatListStore.handleLastMessageUpdated(chatId, lastMessage);
      }),
      this._messengerSocket.onChatPinned(({ chatId, isPinned }) => {
        this._chatListStore.handleChatPinned(chatId, isPinned);
      }),
    ];
  }

  // ── Contacts ────────────────────────────────────────────────────────

  private _setupContactListeners(): Array<() => void> {
    return [
      this._messengerSocket.onContactRequest(contact => {
        this._contactStore.handleContactRequest(contact);
      }),
      this._messengerSocket.onContactAccepted(contact => {
        this._contactStore.handleContactAccepted(contact);
      }),
      this._messengerSocket.onContactRemoved(({ contactId }) => {
        this._contactStore.handleContactRemoved(contactId);
      }),
      this._messengerSocket.onContactBlocked(contact => {
        this._contactStore.handleContactBlocked(contact);
      }),
      this._messengerSocket.onContactUnblocked(contact => {
        this._contactStore.handleContactUnblocked(contact);
      }),
    ];
  }

  // ── Calls ───────────────────────────────────────────────────────────

  private _setupCallListeners(): Array<() => void> {
    return [
      this._messengerSocket.onCallEvents({
        onIncoming: call => this._callStore.handleIncomingCall(call),
        onAnswered: call => this._callStore.handleCallAnswered(call),
        onDeclined: call => this._callStore.handleCallDeclined(call),
        onEnded: data => this._callStore.handleCallEnded(data),
        onMissed: call => this._callStore.handleCallMissed(call),
        onOffer: data => this._callStore.handleOffer(data),
        onAnswer: data => this._callStore.handleAnswer(data),
        onIceCandidate: data => this._callStore.handleIceCandidate(data),
      }),
    ];
  }

  // ── Presence ────────────────────────────────────────────────────────

  private _setupPresenceListeners(): Array<() => void> {
    return [
      this._messengerSocket.onPresenceInit(payload => {
        this._presenceStore.handlePresenceInit(payload);
      }),
      this._messengerSocket.onUserOnline(payload => {
        this._presenceStore.handleUserOnline(payload);
      }),
      this._messengerSocket.onUserOffline(payload => {
        this._presenceStore.handleUserOffline(payload);
      }),
    ];
  }

  // ── Session ─────────────────────────────────────────────────────────

  private _setupSessionListeners(): Array<() => void> {
    return [
      this._messengerSocket.onSessionTerminated(({ sessionId }) => {
        this._sessionStore.handleSessionTerminated(sessionId);
      }),
      this._messengerSocket.onSessionNew(session => {
        this._sessionStore.handleNewSession(session);
      }),
    ];
  }

  // ── User ───────────────────────────────────────────────────────────

  private _setupUserListeners(): Array<() => void> {
    return [
      this._messengerSocket.onEmailVerified(() => {
        this._authStore.handleEmailVerified();
      }),
      this._messengerSocket.onPasswordChanged(() => {
        this._authStore.handlePasswordChanged();
      }),
      this._messengerSocket.onPrivilegesChanged(() => {
        this._authStore.handlePrivilegesChanged();
      }),
      this._messengerSocket.onUsernameChanged(({ username }) => {
        this._profileStore.handleUsernameChanged(username);
      }),
      this._messengerSocket.onPrivacyChanged(settings => {
        this._profileStore.handlePrivacyChanged(settings);
      }),
    ];
  }

  // ── Auth ───────────────────────────────────────────────────────────

  private _setupAuthListeners(): Array<() => void> {
    return [
      this._messengerSocket.on2faChanged(({ enabled }) => {
        this._authStore.handle2faChanged(enabled);
      }),
    ];
  }

  // ── Push ───────────────────────────────────────────────────────────

  private _setupPushListeners(): Array<() => void> {
    return [
      this._messengerSocket.onPushSettingsChanged(settings => {
        this._notificationSettingsStore.handleSettingsChanged(settings);
      }),
    ];
  }
}
